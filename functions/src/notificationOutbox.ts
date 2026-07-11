import { FieldValue, getFirestore } from "firebase-admin/firestore";

export const NOTIFICATION_TYPE_MESSAGE_RECEIVED = "message_received" as const;

export const OUTBOX_STATUS_PENDING = "pending" as const;
export const OUTBOX_STATUS_SKIPPED = "skipped" as const;
export const OUTBOX_STATUS_SENT = "sent" as const;
export const OUTBOX_STATUS_PROCESSING = "processing" as const;
export const OUTBOX_STATUS_RETRYABLE_FAILED = "retryable_failed" as const;
export const OUTBOX_STATUS_PERMANENTLY_FAILED = "permanently_failed" as const;

export const DELIVERY_PROVIDER_NOT_CONFIGURED = "not_configured" as const;
export const DELIVERY_PROVIDER_EXPO = "expo" as const;

export type NotificationType = typeof NOTIFICATION_TYPE_MESSAGE_RECEIVED;

export type NotificationOutboxStatus =
  | typeof OUTBOX_STATUS_PENDING
  | typeof OUTBOX_STATUS_SKIPPED
  | typeof OUTBOX_STATUS_SENT
  | typeof OUTBOX_STATUS_PROCESSING
  | typeof OUTBOX_STATUS_RETRYABLE_FAILED
  | typeof OUTBOX_STATUS_PERMANENTLY_FAILED;

export type DeliveryProvider =
  | typeof DELIVERY_PROVIDER_NOT_CONFIGURED
  | typeof DELIVERY_PROVIDER_EXPO;

export type CreateNotificationOutboxInput = {
  type: NotificationType;
  matchId: string;
  messageId: string;
  senderUid: string;
  recipientUid: string;
  status?: NotificationOutboxStatus;
  deliveryProvider?: DeliveryProvider;
};

export async function createNotificationOutboxRecord(
  input: CreateNotificationOutboxInput
): Promise<string> {
  // A deterministic ID makes Functions event retries and duplicate message
  // events safe without relying on best-effort trigger delivery.
  const idempotencyKey = `${input.type}:${input.matchId}:${input.messageId}:${input.recipientUid}`;
  const docRef = getFirestore().collection("notificationOutbox").doc(idempotencyKey);
  await docRef.set({
    type: input.type,
    matchId: input.matchId,
    messageId: input.messageId,
    senderUid: input.senderUid,
    recipientUid: input.recipientUid,
    status: input.status ?? OUTBOX_STATUS_PENDING,
    deliveryProvider:
      input.deliveryProvider ?? DELIVERY_PROVIDER_NOT_CONFIGURED,
    idempotencyKey,
    retryCount: 0,
    nextAttemptAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return docRef.id;
}
