import assert from "node:assert/strict";
import {
  classifyProviderCode, isExpoPushToken, makeMessagePayload, MAX_PUSH_RETRIES,
  retryDelayMs, validatePayload,
} from "../lib/push/provider.js";
import { normalizeTicket, normalizeReceipt } from "../lib/push/expoProvider.js";
import { canClaimOutbox } from "../lib/pushProcessor.js";
import { Timestamp } from "firebase-admin/firestore";

const target = { token: "ExponentPushToken[unit]", tokenId: "device" };
assert.equal(isExpoPushToken(target.token), true);
assert.equal(isExpoPushToken("nope"), false);
assert.deepEqual(classifyProviderCode("ServiceUnavailable"), { retryable: true, permanent: false, invalidToken: false });
assert.deepEqual(classifyProviderCode("DeviceNotRegistered"), { retryable: false, permanent: true, invalidToken: true });
assert.equal(normalizeTicket(target, { status: "ok", id: "ticket" }).ticketId, "ticket");
assert.equal(normalizeReceipt("ticket", { status: "error", details: { error: "DeviceNotRegistered" } }).invalidToken, true);
const payload = makeMessagePayload({ matchId: "m", senderId: "s", messageId: "message", notificationType: "message_received", idempotencyKey: "key" });
assert.equal(validatePayload(payload), true);
assert.ok(payload.body.length <= 160);
assert.equal(validatePayload({ ...payload, body: "x".repeat(161) }), false);
assert.equal(retryDelayMs(1), 30_000);
assert.equal(retryDelayMs(99), 3_600_000);
assert.equal(MAX_PUSH_RETRIES, 5);
const now = Timestamp.now();
assert.equal(canClaimOutbox({ status: "pending", nextAttemptAt: Timestamp.fromMillis(now.toMillis() - 1) }, now), true);
assert.equal(canClaimOutbox({ status: "processing", leaseExpiresAt: Timestamp.fromMillis(now.toMillis() + 1) }, now), false);
assert.equal(canClaimOutbox({ status: "processing", leaseExpiresAt: Timestamp.fromMillis(now.toMillis() - 1) }, now), true);
console.log("PASS push provider unit tests");
