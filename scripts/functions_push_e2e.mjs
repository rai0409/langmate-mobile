import { createRequire } from "node:module";
import { FakePushProvider } from "../functions/lib/push/fakeProvider.js";
import { processOutboxById, processReceipts } from "../functions/lib/pushProcessor.js";

const requireFunctions = createRequire(new URL("../functions/package.json", import.meta.url));
const { applicationDefault, initializeApp } = requireFunctions("firebase-admin/app");
const { getFirestore } = requireFunctions("firebase-admin/firestore");

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("FIRESTORE_EMULATOR_HOST is required");
initializeApp({ credential: applicationDefault(), projectId: "demo-langmate" });
const db = getFirestore();
const recipient = "functions-push-recipient";
const base = (id, retryCount = 0) => ({
  type: "message_received", matchId: "functions-push-match", messageId: id, senderUid: "functions-push-sender", recipientUid: recipient,
  idempotencyKey: `message_received:functions-push-match:${id}:${recipient}`, status: "pending", retryCount, nextAttemptAt: new Date(Date.now() - 1000), createdAt: new Date(),
});
const waitFor = async (ref, predicate) => {
  for (let i = 0; i < 40; i += 1) { const snap = await ref.get(); if (predicate(snap.data() ?? {})) return snap.data(); await new Promise((r) => setTimeout(r, 250)); }
  throw new Error(`timed out waiting for ${ref.path}`);
};
const prepareManual = async (ref, value) => {
  await ref.set({ ...value, status: "processing", leaseExpiresAt: new Date(Date.now() + 60_000) });
  // The create trigger sees an active processing lease and exits. Only after
  // that invocation has had a chance to read do we expire the lease for the
  // explicit in-process provider injection below; we never expose pending.
  await new Promise((resolve) => setTimeout(resolve, 300));
  await ref.update({ leaseExpiresAt: new Date(Date.now() - 1), nextAttemptAt: new Date(Date.now() - 1) });
};
await db.doc(`users/${recipient}/pushTokens/device-a`).set({ uid: recipient, token: "ExponentPushToken[e2e-a]", platform: "ios", deviceId: "device-a", enabled: true, createdAt: new Date(), updatedAt: new Date(), lastSeenAt: new Date(), invalidatedAt: null, invalidReason: null });
await db.doc(`users/${recipient}/pushTokens/device-b`).set({ uid: recipient, token: "ExponentPushToken[e2e-b]", platform: "android", deviceId: "device-b", enabled: false, createdAt: new Date(), updatedAt: new Date(), lastSeenAt: new Date(), invalidatedAt: null, invalidReason: null });
const success = db.collection("notificationOutbox").doc("push-e2e-success");
await success.set(base("success"));
const sent = await waitFor(success, (value) => value.status === "sent");
if (sent.ticketIds.length !== 1 || sent.receiptStatus !== "pending") throw new Error("expected one enabled token ticket");
await success.set({ check: "rewrite" }, { merge: true });
await new Promise((r) => setTimeout(r, 800));
if ((await success.get()).data().ticketIds.length !== 1) throw new Error("rewrite duplicated delivery");
await processReceipts(db, new FakePushProvider("success"));
if ((await success.get()).data().receiptStatus !== "confirmed") throw new Error("receipt was not confirmed");
const retry = db.collection("notificationOutbox").doc("push-e2e-retry");
await prepareManual(retry, base("retry"));
await processOutboxById(db, retry.id, new FakePushProvider("retryable"));
if ((await retry.get()).data().status !== "retryable_failed") throw new Error("retryable failure did not schedule retry");
const exhausted = db.collection("notificationOutbox").doc("push-e2e-exhausted");
await prepareManual(exhausted, base("exhausted", 4));
await processOutboxById(db, exhausted.id, new FakePushProvider("retryable"));
if ((await exhausted.get()).data().status !== "permanently_failed") throw new Error("retry limit did not terminate");
const invalid = db.collection("notificationOutbox").doc("push-e2e-invalid");
await prepareManual(invalid, base("invalid"));
await processOutboxById(db, invalid.id, new FakePushProvider("invalid"));
if ((await db.doc(`users/${recipient}/pushTokens/device-a`).get()).data().enabled !== false) throw new Error("invalid token was not disabled");
const noTokens = db.collection("notificationOutbox").doc("push-e2e-no-tokens");
await noTokens.set({ ...base("none"), recipientUid: "no-token-user", idempotencyKey: "no-token" });
await processOutboxById(db, noTokens.id, new FakePushProvider("success"));
if ((await noTokens.get()).data().status !== "skipped") throw new Error("missing tokens did not skip");
await db.doc(`users/${recipient}/pushTokens/device-a`).update({ enabled: true });
const receiptInvalid = db.collection("notificationOutbox").doc("push-e2e-receipt-invalid");
await prepareManual(receiptInvalid, base("receipt-invalid"));
await processOutboxById(db, receiptInvalid.id, new FakePushProvider("success"));
await processReceipts(db, new FakePushProvider("receipt-invalid"));
if ((await db.doc(`users/${recipient}/pushTokens/device-a`).get()).data().enabled !== false) throw new Error("receipt invalid token was not disabled");
console.log("PASS functions push E2E");
