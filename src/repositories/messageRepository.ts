import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { requireDb } from "../firebase/config";
import type { ChatMessage } from "../types/domain";

function messagesCollection(matchId: string) {
  return collection(requireDb(), "matches", matchId, "messages");
}

export function listenMessages(
  matchId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  return onSnapshot(
    query(messagesCollection(matchId), orderBy("createdAt", "asc")),
    (snapshot) => {
      callback(
        snapshot.docs.map((d) => ({
          ...(d.data() as ChatMessage),
          id: d.id,
        }))
      );
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
  if (!trimmed) return;
  const db = requireDb();
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
