import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  DELIVERY_PROVIDER_NOT_CONFIGURED,
  NOTIFICATION_TYPE_MESSAGE_RECEIVED,
  OUTBOX_STATUS_PENDING,
  createNotificationOutboxRecord,
} from "./notificationOutbox";

type MatchDocument = {
  memberUids?: unknown;
};

type MessageDocument = {
  fromUid?: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export const incrementUnreadForMessage = onDocumentCreated(
  "matches/{matchId}/messages/{messageId}",
  async (event) => {
    const messageSnapshot = event.data;
    if (!messageSnapshot) {
      return;
    }

    const { matchId, messageId } = event.params;
    const message = messageSnapshot.data() as MessageDocument;
    const senderUid = message.fromUid;

    if (typeof senderUid !== "string" || senderUid.length === 0) {
      return;
    }

    const db = getFirestore();
    const matchSnapshot = await db.doc(`matches/${matchId}`).get();
    if (!matchSnapshot.exists) {
      return;
    }

    const match = matchSnapshot.data() as MatchDocument | undefined;
    const memberUids = match?.memberUids;
    if (!isStringArray(memberUids) || !memberUids.includes(senderUid)) {
      return;
    }

    const recipientUids = memberUids.filter((uid) => uid !== senderUid);
    if (recipientUids.length !== 1) {
      return;
    }

    const recipientUid = recipientUids[0];
    await db
      .doc(`matches/${matchId}/memberStates/${recipientUid}`)
      .set(
        {
          unreadCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    await createNotificationOutboxRecord({
      type: NOTIFICATION_TYPE_MESSAGE_RECEIVED,
      matchId,
      messageId,
      senderUid,
      recipientUid,
      status: OUTBOX_STATUS_PENDING,
      deliveryProvider: DELIVERY_PROVIDER_NOT_CONFIGURED,
    });
  }
);
