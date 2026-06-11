import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { requireDb } from "../firebase/config";
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
  const db = requireDb();
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

export async function listMatchesForUser(uid: string): Promise<Match[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, MATCHES), where("memberUids", "array-contains", uid))
  );
  return snapshot.docs.map((d) => ({ ...(d.data() as Match), matchId: d.id }));
}

export function listenMatchesForUser(
  uid: string,
  callback: (matches: Match[]) => void
): () => void {
  const db = requireDb();
  return onSnapshot(
    query(collection(db, MATCHES), where("memberUids", "array-contains", uid)),
    (snapshot) => {
      callback(
        snapshot.docs.map((d) => ({ ...(d.data() as Match), matchId: d.id }))
      );
    }
  );
}
