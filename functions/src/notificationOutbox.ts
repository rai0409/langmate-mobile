import { FieldValue, getFirestore } from "firebase-admin/firestore";

export const NOTIFICATION_TYPE_MESSAGE_RECEIVED = "message_received" as const;

export const OUTBOX_STATUS_PENDING = "pending" as const;
export const OUTBOX_STATUS_SKIPPED = "skipped" as const;
export const OUTBOX_STATUS_SENT = "sent" as const;
export const OUTBOX_STATUS_FAILED = "failed" as const;

export const DELIVERY_PROVIDER_NOT_CONFIGURED = "not_configured" as const;

export type NotificationType = typeof NOTIFICATION_TYPE_MESSAGE_RECEIVED;

export type NotificationOutboxStatus =
  | typeof OUTBOX_STATUS_PENDING
  | typeof OUTBOX_STATUS_SKIPPED
  | typeof OUTBOX_STATUS_SENT
  | typeof OUTBOX_STATUS_FAILED;

export type DeliveryProvider = typeof DELIVERY_PROVIDER_NOT_CONFIGURED;

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
  const docRef = await getFirestore().collection("notificationOutbox").add({
    type: input.type,
    matchId: input.matchId,
    messageId: input.messageId,
    senderUid: input.senderUid,
    recipientUid: input.recipientUid,
    status: input.status ?? OUTBOX_STATUS_PENDING,
    deliveryProvider:
      input.deliveryProvider ?? DELIVERY_PROVIDER_NOT_CONFIGURED,
    createdAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}
