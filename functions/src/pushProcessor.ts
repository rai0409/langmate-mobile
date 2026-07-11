import { createHash } from "node:crypto";
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  OUTBOX_STATUS_PERMANENTLY_FAILED,
  OUTBOX_STATUS_PROCESSING,
  OUTBOX_STATUS_RETRYABLE_FAILED,
  OUTBOX_STATUS_SENT,
  OUTBOX_STATUS_SKIPPED,
  type NotificationOutboxStatus,
} from "./notificationOutbox";
import { getPushProvider } from "./push/factory";
import {
  isExpoPushToken,
  makeMessagePayload,
  MAX_PUSH_RETRIES,
  MAX_RECEIPT_CHECKS,
  PROCESSING_LEASE_MS,
  retryDelayMs,
  type PushProvider,
  type PushTarget,
} from "./push/provider";

type Outbox = {
  type?: string; matchId?: string; messageId?: string; senderUid?: string; recipientUid?: string;
  idempotencyKey?: string; status?: NotificationOutboxStatus; retryCount?: number;
  nextAttemptAt?: Timestamp; leaseExpiresAt?: Timestamp; ticketIds?: string[]; receiptCheckCount?: number;
};
type PushToken = { token?: string; enabled?: boolean };

function tokenFingerprint(token: string): string { return createHash("sha256").update(token).digest("hex").slice(0, 12); }
function nowTimestamp(): Timestamp { return Timestamp.now(); }

export function canClaimOutbox(outbox: Outbox, now = nowTimestamp()): boolean {
  const due = !outbox.nextAttemptAt || outbox.nextAttemptAt.toMillis() <= now.toMillis();
  const leaseExpired = !outbox.leaseExpiresAt || outbox.leaseExpiresAt.toMillis() <= now.toMillis();
  return (outbox.status === "pending" || outbox.status === OUTBOX_STATUS_RETRYABLE_FAILED) && due
    || (outbox.status === OUTBOX_STATUS_PROCESSING && leaseExpired);
}

async function claim(db: Firestore, outboxId: string): Promise<Outbox | null> {
  const ref = db.collection("notificationOutbox").doc(outboxId);
  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return null;
    const outbox = snapshot.data() as Outbox;
    if (!canClaimOutbox(outbox)) return null;
    tx.update(ref, {
      status: OUTBOX_STATUS_PROCESSING,
      leaseExpiresAt: Timestamp.fromMillis(Date.now() + PROCESSING_LEASE_MS),
      processingStartedAt: FieldValue.serverTimestamp(),
    });
    return outbox;
  });
}

function safeOutbox(outbox: Outbox): outbox is Required<Pick<Outbox, "type" | "matchId" | "messageId" | "senderUid" | "recipientUid" | "idempotencyKey">> {
  return [outbox.type, outbox.matchId, outbox.messageId, outbox.senderUid, outbox.recipientUid, outbox.idempotencyKey].every((v) => typeof v === "string" && v.length > 0);
}

async function terminal(db: Firestore, id: string, status: typeof OUTBOX_STATUS_SKIPPED | typeof OUTBOX_STATUS_PERMANENTLY_FAILED, reason: string): Promise<void> {
  await db.collection("notificationOutbox").doc(id).update({ status, terminalReason: reason, failedAt: status === OUTBOX_STATUS_PERMANENTLY_FAILED ? FieldValue.serverTimestamp() : null, leaseExpiresAt: null });
}

export async function processOutboxById(db: Firestore, outboxId: string, provider: PushProvider | null = getPushProvider()): Promise<void> {
  const started = Date.now();
  const outbox = await claim(db, outboxId);
  if (!outbox) return;
  const attempt = (outbox.retryCount ?? 0) + 1;
  if (!safeOutbox(outbox)) return terminal(db, outboxId, OUTBOX_STATUS_PERMANENTLY_FAILED, "invalid_outbox");
  if (!provider) return terminal(db, outboxId, OUTBOX_STATUS_PERMANENTLY_FAILED, "provider_not_configured");
  const tokenSnapshots = await db.collection(`users/${outbox.recipientUid}/pushTokens`).where("enabled", "==", true).get();
  const targets: PushTarget[] = tokenSnapshots.docs.flatMap((doc) => {
    const token = (doc.data() as PushToken).token;
    return typeof token === "string" && isExpoPushToken(token) ? [{ token, tokenId: doc.id }] : [];
  });
  if (targets.length === 0) return terminal(db, outboxId, OUTBOX_STATUS_SKIPPED, "no_enabled_tokens");
  const payload = makeMessagePayload({ matchId: outbox.matchId, senderId: outbox.senderUid, messageId: outbox.messageId, notificationType: outbox.type, idempotencyKey: outbox.idempotencyKey });
  try {
    const results = await provider.sendPushBatch(targets, payload);
    const invalid = results.filter((result) => result.invalidToken);
    await Promise.all(invalid.map((result) => db.doc(`users/${outbox.recipientUid}/pushTokens/${result.target.tokenId}`).update({ enabled: false, invalidatedAt: FieldValue.serverTimestamp(), invalidReason: result.code ?? "invalid_token" })));
    const tickets = results.flatMap((result) => result.ticketId ? [result.ticketId] : []);
    const retryable = results.some((result) => result.retryable);
    const allPermanent = results.every((result) => result.permanent);
    const ref = db.collection("notificationOutbox").doc(outboxId);
    if (tickets.length > 0) {
      await ref.update({ status: OUTBOX_STATUS_SENT, deliveryProvider: provider.name, ticketIds: tickets, ticketTokenIds: Object.fromEntries(results.flatMap((r) => r.ticketId ? [[r.ticketId, r.target.tokenId]] : [])), receiptStatus: "pending", receiptCheckCount: 0, sentAt: FieldValue.serverTimestamp(), providerResponse: results.map((r) => ({ ok: r.ok, ...(r.code ? { code: r.code } : {}), ...(r.ticketId ? { ticketId: r.ticketId } : {}), tokenHash: tokenFingerprint(r.target.token) })), leaseExpiresAt: null });
    } else if (retryable && attempt < MAX_PUSH_RETRIES) {
      await ref.update({ status: OUTBOX_STATUS_RETRYABLE_FAILED, retryCount: attempt, nextAttemptAt: Timestamp.fromMillis(Date.now() + retryDelayMs(attempt)), providerResponse: results.map((r) => ({ ok: r.ok, ...(r.code ? { code: r.code } : {}) })), leaseExpiresAt: null });
    } else {
      await terminal(db, outboxId, OUTBOX_STATUS_PERMANENTLY_FAILED, allPermanent ? "provider_permanent_failure" : "retry_limit_exceeded");
    }
    logger.info("push_outbox_processed", { outboxId, notificationType: outbox.type, attempt, provider: provider.name, normalizedResult: tickets.length ? "ticketed" : retryable ? "retryable_failed" : "permanently_failed", retryable, durationMs: Date.now() - started, terminalStatus: tickets.length ? null : retryable && attempt < MAX_PUSH_RETRIES ? null : OUTBOX_STATUS_PERMANENTLY_FAILED });
  } catch {
    const ref = db.collection("notificationOutbox").doc(outboxId);
    if (attempt >= MAX_PUSH_RETRIES) await terminal(db, outboxId, OUTBOX_STATUS_PERMANENTLY_FAILED, "provider_transport_retry_limit");
    else await ref.update({ status: OUTBOX_STATUS_RETRYABLE_FAILED, retryCount: attempt, nextAttemptAt: Timestamp.fromMillis(Date.now() + retryDelayMs(attempt)), leaseExpiresAt: null });
    logger.warn("push_outbox_transport_failure", { outboxId, notificationType: outbox.type, attempt, provider: provider.name, retryable: attempt < MAX_PUSH_RETRIES, durationMs: Date.now() - started });
  }
}

export async function processReceipts(db: Firestore, provider: PushProvider | null = getPushProvider()): Promise<void> {
  if (!provider) return;
  const snapshot = await db.collection("notificationOutbox").where("status", "==", OUTBOX_STATUS_SENT).where("receiptStatus", "==", "pending").limit(100).get();
  for (const document of snapshot.docs) {
    const outbox = document.data() as Outbox;
    const ticketIds = outbox.ticketIds ?? [];
    const checks = (outbox.receiptCheckCount ?? 0) + 1;
    if (checks > MAX_RECEIPT_CHECKS) { await document.ref.update({ receiptStatus: "exhausted", receiptCheckCount: checks }); continue; }
    try {
      const receipts = await provider.getReceipts(ticketIds);
      const invalid = receipts.filter((r) => r.invalidToken);
      if (invalid.length > 0 && outbox.recipientUid) {
        const ticketTokenIds = (document.data().ticketTokenIds ?? {}) as Record<string, string>;
        await Promise.all(invalid.flatMap((receipt) => {
          const tokenId = ticketTokenIds[receipt.ticketId];
          return tokenId ? [db.doc(`users/${outbox.recipientUid}/pushTokens/${tokenId}`).update({ enabled: false, invalidatedAt: FieldValue.serverTimestamp(), invalidReason: "DeviceNotRegistered" })] : [];
        }));
      }
      if (receipts.some((r) => r.retryable)) await document.ref.update({ receiptStatus: "retryable_failed", receiptCheckCount: checks, nextReceiptAttemptAt: Timestamp.fromMillis(Date.now() + retryDelayMs(checks)) });
      else if (receipts.some((r) => r.permanent)) await document.ref.update({ receiptStatus: "permanently_failed", receiptCheckCount: checks, failedAt: FieldValue.serverTimestamp() });
      else await document.ref.update({ receiptStatus: "confirmed", receiptCheckCount: checks, receiptCheckedAt: FieldValue.serverTimestamp() });
    } catch {
      await document.ref.update({ receiptCheckCount: checks, receiptStatus: checks >= MAX_RECEIPT_CHECKS ? "exhausted" : "pending" });
    }
  }
}

export const deliverNotificationOutbox = onDocumentCreated("notificationOutbox/{outboxId}", async (event) => {
  await processOutboxById(event.data!.ref.firestore, event.params.outboxId);
});

export const retryNotificationOutbox = onSchedule("every 5 minutes", async () => {
  const db = (await import("firebase-admin/firestore")).getFirestore();
  const retryable = await db.collection("notificationOutbox").where("status", "in", ["pending", OUTBOX_STATUS_RETRYABLE_FAILED]).limit(100).get();
  await Promise.all(retryable.docs.map((doc) => processOutboxById(db, doc.id)));
  await processReceipts(db);
});
