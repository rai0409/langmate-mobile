import {
  addDoc,
  collection,
  doc,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getConfiguredDb } from "./firestoreHelpers";
import type { ChatMessage } from "../types/domain";

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
  const message: ChatMessage = {
    fromUid,
    text: trimmed,
    createdAt: serverTimestamp(),
  };
  await addDoc(messagesCollection(matchId), message);
  await setDoc(
    doc(db, "matches", matchId),
    { lastMessage: trimmed, lastSentAt: serverTimestamp() },
    { merge: true }
  );
}
