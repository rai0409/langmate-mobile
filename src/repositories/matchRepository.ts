import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getConfiguredDb } from "./firestoreHelpers";
import type { Match } from "../types/domain";
import { getSwipe } from "./swipeRepository";

const MATCHES = "matches";

export function buildMatchId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

/**
 * Creates the match document only when both users have a "connect" swipe
 * toward each other. Returns the Match when one exists (created now or
 * earlier), otherwise null.
 */
export async function createMatchIfMutualConnect(
  currentUid: string,
  targetUid: string
): Promise<Match | null> {
  const db = getConfiguredDb();
  const matchId = buildMatchId(currentUid, targetUid);

  const existing = await getDoc(doc(db, MATCHES, matchId));
  if (existing.exists()) {
    return { ...(existing.data() as Match), matchId };
  }

  const [mySwipe, theirSwipe] = await Promise.all([
    getSwipe(currentUid, targetUid),
    getSwipe(targetUid, currentUid),
  ]);
  if (mySwipe?.action !== "connect" || theirSwipe?.action !== "connect") {
    return null;
  }

  const match: Match = {
    matchId,
    memberUids: [currentUid, targetUid].sort(),
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, MATCHES, matchId), match, { merge: true });
  return match;
}

export const MATCHES_QUERY_LIMIT = 50;

export async function listMatchesForUser(
  uid: string,
  limitCount: number = MATCHES_QUERY_LIMIT
): Promise<Match[]> {
  const db = getConfiguredDb();
  const snapshot = await getDocs(
    query(
      collection(db, MATCHES),
      where("memberUids", "array-contains", uid),
      limit(limitCount)
    )
  );
  return snapshot.docs.map((d) => ({ ...(d.data() as Match), matchId: d.id }));
}

export function listenMatchesForUser(
  uid: string,
  callback: (matches: Match[]) => void,
  onError?: (error: Error) => void,
  limitCount: number = MATCHES_QUERY_LIMIT
): () => void {
  const db = getConfiguredDb();
  return onSnapshot(
    query(
      collection(db, MATCHES),
      where("memberUids", "array-contains", uid),
      limit(limitCount)
    ),
    (snapshot) => {
      callback(
        snapshot.docs.map((d) => ({ ...(d.data() as Match), matchId: d.id }))
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}
