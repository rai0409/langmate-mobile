import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { getConfiguredDb } from "./firestoreHelpers";
import type { Match } from "../types/domain";

const MATCHES = "matches";
const SERVER_MATCH_WAIT_MS = 5000;

export function buildMatchId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

function matchFromSnapshot(
  snapshot: Awaited<ReturnType<typeof getDoc>>
): Match | null {
  if (!snapshot.exists()) return null;
  return { ...(snapshot.data() as Match), matchId: snapshot.id };
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const db = getConfiguredDb();
  const snapshot = await getDoc(doc(db, MATCHES, matchId));
  return matchFromSnapshot(snapshot);
}

export async function waitForServerCreatedMatch(
  currentUid: string,
  targetUid: string,
  timeoutMs: number = SERVER_MATCH_WAIT_MS
): Promise<Match | null> {
  const db = getConfiguredDb();
  const matchId = buildMatchId(currentUid, targetUid);
  const matchRef = doc(db, MATCHES, matchId);

  const existing = await getDoc(matchRef);
  const existingMatch = matchFromSnapshot(existing);
  if (existingMatch) return existingMatch;

  return new Promise((resolve, reject) => {
    let settled = false;
    let unsubscribe: (() => void) | null = null;

    const finish = (match: Match | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe?.();
      resolve(match);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    unsubscribe = onSnapshot(
      matchRef,
      (snapshot) => {
        const match = matchFromSnapshot(snapshot);
        if (match) {
          finish(match);
        }
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        unsubscribe?.();
        reject(error);
      }
    );
  });
}

/**
 * Compatibility wrapper for Connect callers. Match creation is server-authority:
 * this waits briefly for the trusted Function to create matches/{matchId}.
 */
export async function createMatchIfMutualConnect(
  currentUid: string,
  targetUid: string
): Promise<Match | null> {
  return waitForServerCreatedMatch(currentUid, targetUid);
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
