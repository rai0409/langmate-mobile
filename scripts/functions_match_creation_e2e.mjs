import { createRequire } from "node:module";

const projectId = "demo-langmate";
const userA = "functions-match-e2e-user-a";
const userB = "functions-match-e2e-user-b";
const skipUserA = "functions-match-e2e-skip-user-a";
const skipUserB = "functions-match-e2e-skip-user-b";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    "FAIL functions match creation E2E: FIRESTORE_EMULATOR_HOST is not set. Run through firebase emulators:exec."
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

function buildSwipeId(fromUid, toUid) {
  return `${fromUid}_${toUid}`;
}

function buildMatchId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

function sortedMembers(uidA, uidB) {
  return [uidA, uidB].sort();
}

function sameMembers(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((uid, index) => uid === expected[index])
  );
}

async function clearPair(fromUid, toUid) {
  await db.doc(`swipes/${buildSwipeId(fromUid, toUid)}`).delete();
  await db.doc(`swipes/${buildSwipeId(toUid, fromUid)}`).delete();
  await db.doc(`matches/${buildMatchId(fromUid, toUid)}`).delete();
}

async function clearTestDocuments() {
  await clearPair(userA, userB);
  await clearPair(skipUserA, skipUserB);
}

async function writeSwipe(fromUid, toUid, action) {
  await db.doc(`swipes/${buildSwipeId(fromUid, toUid)}`).set({
    fromUid,
    toUid,
    action,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function readMatch(uidA, uidB) {
  const matchId = buildMatchId(uidA, uidB);
  const snapshot = await db.doc(`matches/${matchId}`).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function pollForMatch(uidA, uidB, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let match = null;
  while (Date.now() < deadline) {
    match = await readMatch(uidA, uidB);
    if (match) return match;
    await sleep(200);
  }
  return match;
}

async function verifyNoMatch(uidA, uidB, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const match = await readMatch(uidA, uidB);
    if (match) {
      throw new Error(`unexpected match ${match.id}`);
    }
    await sleep(200);
  }
}

async function countMatchesForPair(uidA, uidB) {
  const expected = sortedMembers(uidA, uidB);
  const snapshot = await db
    .collection("matches")
    .where("memberUids", "array-contains", uidA)
    .get();
  return snapshot.docs.filter((doc) =>
    sameMembers(doc.data().memberUids, expected)
  ).length;
}

function assertValidMatch(match, uidA, uidB) {
  const matchId = buildMatchId(uidA, uidB);
  const expectedMembers = sortedMembers(uidA, uidB);

  if (!match) {
    throw new Error(`expected match ${matchId} to exist`);
  }
  if (match.id !== matchId || match.matchId !== matchId) {
    throw new Error(`expected matchId ${matchId}, got ${match.matchId}`);
  }
  if (!sameMembers(match.memberUids, expectedMembers)) {
    throw new Error(
      `expected memberUids ${expectedMembers.join(",")}, got ${match.memberUids}`
    );
  }
  if (!match.createdAt) {
    throw new Error("createdAt is missing");
  }
  if (!match.updatedAt) {
    throw new Error("updatedAt is missing");
  }
}

function timestampsEqual(left, right) {
  if (left?.isEqual && right) {
    return left.isEqual(right);
  }
  return String(left) === String(right);
}

try {
  console.log("functions match creation E2E: clearing prior test documents");
  await clearTestDocuments();

  console.log("functions match creation E2E: case 1 one-sided connect");
  await writeSwipe(userA, userB, "connect");
  await verifyNoMatch(userA, userB);
  console.log("PASS functions match creation E2E: one-sided connect did not match");

  console.log("functions match creation E2E: case 2 mutual connect");
  await writeSwipe(userB, userA, "connect");
  const match = await pollForMatch(userA, userB);
  assertValidMatch(match, userA, userB);
  const matchCount = await countMatchesForPair(userA, userB);
  if (matchCount !== 1) {
    throw new Error(`expected one match for pair, got ${matchCount}`);
  }
  console.log("PASS functions match creation E2E: mutual connect created one match");

  console.log("functions match creation E2E: case 3 idempotency");
  const createdAt = match.createdAt;
  await writeSwipe(userA, userB, "connect");
  const rewrittenMatch = await pollForMatch(userA, userB);
  assertValidMatch(rewrittenMatch, userA, userB);
  const rewrittenMatchCount = await countMatchesForPair(userA, userB);
  if (rewrittenMatchCount !== 1) {
    throw new Error(
      `expected one match after rewrite, got ${rewrittenMatchCount}`
    );
  }
  if (!timestampsEqual(createdAt, rewrittenMatch.createdAt)) {
    throw new Error("createdAt changed after idempotent rewrite");
  }
  console.log("PASS functions match creation E2E: connect rewrite stayed idempotent");

  console.log("functions match creation E2E: case 4 skip does not match");
  await writeSwipe(skipUserA, skipUserB, "connect");
  await writeSwipe(skipUserB, skipUserA, "skip");
  await verifyNoMatch(skipUserA, skipUserB);
  console.log("PASS functions match creation E2E: skip did not match");
} catch (error) {
  console.error(
    `FAIL functions match creation E2E: ${
      error instanceof Error ? error.message : error
    }`
  );
  process.exit(1);
}
