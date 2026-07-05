import {
  collection,
  doc,
  getDoc,
  increment,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getConfiguredDb } from "./firestoreHelpers";
import { memberStateDocRef } from "./memberStateRepository";
import { isBlockedBetween } from "./safetyRepository";
import type { ChatMessage, Match } from "../types/domain";

function messagesCollection(matchId: string) {
  return collection(getConfiguredDb(), "matches", matchId, "messages");
}

export const MESSAGES_QUERY_LIMIT = 100;

/**
 * Listens to the most recent `limitCount` messages, delivered in
 * createdAt-ascending order (limitToLast keeps the newest window, so fresh
 * messages never fall outside the limit).
 */
export function listenMessages(
  matchId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
  limitCount: number = MESSAGES_QUERY_LIMIT
): () => void {
  return onSnapshot(
    query(
      messagesCollection(matchId),
      orderBy("createdAt", "asc"),
      limitToLast(limitCount)
    ),
    (snapshot) => {
      callback(
        snapshot.docs.map((d) => ({
          ...(d.data() as ChatMessage),
          id: d.id,
        }))
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}

/**
 * fromUid must be the real authenticated uid passed in by the caller.
 * Never a hardcoded placeholder.
 */
export async function sendMessage(
  matchId: string,
  fromUid: string,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message text is empty. Write something before sending.");
  }
  const db = getConfiguredDb();
  const matchSnapshot = await getDoc(doc(db, "matches", matchId));
  if (!matchSnapshot.exists()) {
    throw new Error("This chat is no longer available.");
  }
  const match = { ...(matchSnapshot.data() as Match), matchId };
  if (!match.memberUids.includes(fromUid)) {
    throw new Error("You are not a member of this chat.");
  }
  const otherUid = match.memberUids.find((uid) => uid !== fromUid);
  if (!otherUid) {
    throw new Error("This chat does not have another participant.");
  }
  if (await isBlockedBetween(fromUid, otherUid)) {
    throw new Error("Messaging is disabled because one of you has blocked the other.");
  }
  const message: ChatMessage = {
    fromUid,
    text: trimmed,
    createdAt: serverTimestamp(),
  };
  // MVP client-side unread update. Production should move unread counts and
  // push notification fanout into Cloud Functions for reliable server authority.
  const batch = writeBatch(db);
  batch.set(doc(messagesCollection(matchId)), message);
  batch.set(
    doc(db, "matches", matchId),
    { lastMessage: trimmed, lastSentAt: serverTimestamp() },
    { merge: true }
  );
  batch.set(
    memberStateDocRef(matchId, otherUid),
    { unreadCount: increment(1), updatedAt: serverTimestamp() },
    { merge: true }
  );
  await batch.commit();
}
