import { createRequire } from "node:module";

const projectId = "demo-langmate";
const matchId = "functions-unread-e2e-match";
const messageId = "functions-unread-e2e-message";
const senderUid = "functions-unread-e2e-sender";
const recipientUid = "functions-unread-e2e-recipient";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    "FAIL functions unread E2E: FIRESTORE_EMULATOR_HOST is not set. Run through firebase emulators:exec."
  );
  process.exit(1);
}

const requireFromFunctions = createRequire(
  new URL("../functions/package.json", import.meta.url)
);
const { initializeApp } = requireFromFunctions("firebase-admin/app");
const { FieldValue, getFirestore } = requireFromFunctions(
  "firebase-admin/firestore"
);

initializeApp({ projectId });

const db = getFirestore();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deleteQuerySnapshot(snapshot) {
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  if (!snapshot.empty) {
    await batch.commit();
  }
}

async function clearTestDocuments() {
  await db.doc(`matches/${matchId}/messages/${messageId}`).delete();
  await db.doc(`matches/${matchId}/memberStates/${recipientUid}`).delete();
  await db.doc(`matches/${matchId}/memberStates/${senderUid}`).delete();
  await db.doc(`matches/${matchId}`).delete();

  const outboxSnapshot = await db
    .collection("notificationOutbox")
    .where("matchId", "==", matchId)
    .get();
  await deleteQuerySnapshot(outboxSnapshot);
}

async function readVerificationState() {
  const memberStateSnapshot = await db
    .doc(`matches/${matchId}/memberStates/${recipientUid}`)
    .get();
  const unreadCount = memberStateSnapshot.data()?.unreadCount ?? 0;

  const outboxSnapshot = await db
    .collection("notificationOutbox")
    .where("matchId", "==", matchId)
    .get();
  const matchingOutboxDocs = outboxSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter(
      (doc) =>
        doc.type === "message_received" &&
        doc.matchId === matchId &&
        doc.messageId === messageId &&
        doc.senderUid === senderUid &&
        doc.recipientUid === recipientUid &&
        doc.status === "pending" &&
        doc.deliveryProvider === "not_configured"
    );

  return {
    unreadCount,
    matchingOutboxCount: matchingOutboxDocs.length,
    totalOutboxForMatch: outboxSnapshot.size,
  };
}

async function pollForVerification() {
  const deadline = Date.now() + 10000;
  let lastState = {
    unreadCount: 0,
    matchingOutboxCount: 0,
    totalOutboxForMatch: 0,
  };

  while (Date.now() < deadline) {
    lastState = await readVerificationState();
    if (
      lastState.unreadCount >= 1 &&
      lastState.matchingOutboxCount === 1 &&
      lastState.totalOutboxForMatch === 1
    ) {
      return lastState;
    }
    await sleep(200);
  }

  return lastState;
}

try {
  console.log("functions unread E2E: clearing prior test documents");
  await clearTestDocuments();

  console.log("functions unread E2E: seeding match");
  await db.doc(`matches/${matchId}`).set({
    memberUids: [senderUid, recipientUid],
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log("functions unread E2E: creating message");
  await db.doc(`matches/${matchId}/messages/${messageId}`).set({
    fromUid: senderUid,
    text: "hello from functions unread E2E",
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log("functions unread E2E: waiting for trigger effects");
  const state = await pollForVerification();

  if (state.unreadCount < 1) {
    throw new Error(`recipient unreadCount was ${state.unreadCount}`);
  }
  if (state.matchingOutboxCount !== 1 || state.totalOutboxForMatch !== 1) {
    throw new Error(
      `expected one matching notificationOutbox record, got ${state.matchingOutboxCount} matching and ${state.totalOutboxForMatch} total for match`
    );
  }

  console.log("PASS functions unread E2E: unread increment verified");
  console.log("PASS functions unread E2E: notificationOutbox verified");
} catch (error) {
  console.error(
    `FAIL functions unread E2E: ${error instanceof Error ? error.message : error}`
  );
  process.exit(1);
}
