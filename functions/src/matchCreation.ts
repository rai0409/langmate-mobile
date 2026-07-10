import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

type SwipeDocument = {
  fromUid?: unknown;
  toUid?: unknown;
  action?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function buildSwipeId(fromUid: string, toUid: string): string {
  return `${fromUid}_${toUid}`;
}

function buildMatchId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

export const createMatchForMutualConnect = onDocumentWritten(
  "swipes/{swipeId}",
  async (event) => {
    const afterSnapshot = event.data?.after;
    if (!afterSnapshot?.exists) {
      return;
    }

    const swipe = afterSnapshot.data() as SwipeDocument | undefined;
    if (!swipe || swipe.action !== "connect") {
      return;
    }

    const { swipeId } = event.params;
    const fromUid = swipe.fromUid;
    const toUid = swipe.toUid;

    if (
      !isNonEmptyString(fromUid) ||
      !isNonEmptyString(toUid) ||
      fromUid === toUid ||
      swipeId !== buildSwipeId(fromUid, toUid)
    ) {
      return;
    }

    const db = getFirestore();
    const reverseSwipeRef = db.doc(`swipes/${buildSwipeId(toUid, fromUid)}`);
    const matchId = buildMatchId(fromUid, toUid);
    const matchRef = db.doc(`matches/${matchId}`);
    const memberUids = [fromUid, toUid].sort();

    await db.runTransaction(async (transaction) => {
      const reverseSwipeSnapshot = await transaction.get(reverseSwipeRef);
      if (!reverseSwipeSnapshot.exists) {
        return;
      }

      const reverseSwipe = reverseSwipeSnapshot.data() as
        | SwipeDocument
        | undefined;
      if (
        reverseSwipe?.action !== "connect" ||
        reverseSwipe.fromUid !== toUid ||
        reverseSwipe.toUid !== fromUid
      ) {
        return;
      }

      const matchSnapshot = await transaction.get(matchRef);
      const timestamp = FieldValue.serverTimestamp();
      const existingCreatedAt = matchSnapshot.exists
        ? matchSnapshot.data()?.createdAt
        : undefined;

      transaction.set(
        matchRef,
        {
          matchId,
          memberUids,
          createdAt: existingCreatedAt ?? timestamp,
          updatedAt: timestamp,
        },
        { merge: true }
      );
    });
  }
);
