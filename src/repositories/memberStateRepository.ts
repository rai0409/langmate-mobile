import {
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { MatchMemberState } from "../types/domain";
import { getConfiguredDb } from "./firestoreHelpers";

export function memberStateDocRef(matchId: string, uid: string) {
  return doc(getConfiguredDb(), "matches", matchId, "memberStates", uid);
}

export async function incrementUnreadForRecipient(
  matchId: string,
  recipientUid: string
): Promise<void> {
  // Product-preview client-side unread update. Production should move unread counts and
  // push notification fanout into Cloud Functions for reliable server authority.
  await setDoc(
    memberStateDocRef(matchId, recipientUid),
    {
      unreadCount: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function markMatchRead(matchId: string, uid: string): Promise<void> {
  await setDoc(
    memberStateDocRef(matchId, uid),
    {
      unreadCount: 0,
      lastReadAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function listenMemberState(
  matchId: string,
  uid: string,
  callback: (state: MatchMemberState) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    memberStateDocRef(matchId, uid),
    (snapshot) => {
      const data = snapshot.exists()
        ? (snapshot.data() as Partial<MatchMemberState>)
        : {};
      callback({
        unreadCount:
          typeof data.unreadCount === "number" ? data.unreadCount : 0,
        lastReadAt: data.lastReadAt,
        muted: data.muted,
        updatedAt: data.updatedAt,
      });
    },
    (error) => {
      onError?.(error);
    }
  );
}
