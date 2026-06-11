import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getConfiguredDb } from "./firestoreHelpers";
import type { Block, Report } from "../types/domain";

const BLOCKS = "blocks";

export function buildBlockId(blockerUid: string, blockedUid: string): string {
  return `${blockerUid}_${blockedUid}`;
}

export async function blockUser(
  blockerUid: string,
  blockedUid: string
): Promise<void> {
  const db = getConfiguredDb();
  const block: Block = {
    blockerUid,
    blockedUid,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, BLOCKS, buildBlockId(blockerUid, blockedUid)), block);
}

/**
 * Returns every block record involving `uid`: blocks the user created
 * (outgoing) and blocks created against the user (incoming). Firestore has
 * no OR query across two fields without composite tricks, so this runs two
 * simple single-field queries and merges — no composite index required.
 */
export async function listBlocksForUser(uid: string): Promise<Block[]> {
  const db = getConfiguredDb();
  const [outgoing, incoming] = await Promise.all([
    getDocs(query(collection(db, BLOCKS), where("blockerUid", "==", uid))),
    getDocs(query(collection(db, BLOCKS), where("blockedUid", "==", uid))),
  ]);
  const merged = new Map<string, Block>();
  for (const snapshot of [outgoing, incoming]) {
    for (const d of snapshot.docs) {
      merged.set(d.id, d.data() as Block);
    }
  }
  return [...merged.values()];
}

/**
 * Realtime variant of listBlocksForUser: two listeners (outgoing/incoming)
 * merged into one callback. Returns a single unsubscribe for both.
 */
export function listenBlocksForUser(
  uid: string,
  callback: (blocks: Block[]) => void,
  onError?: (error: Error) => void
): () => void {
  const db = getConfiguredDb();
  const docsById = new Map<string, Block>();
  const seen = { outgoing: false, incoming: false };

  const emit = () => {
    if (seen.outgoing && seen.incoming) {
      callback([...docsById.values()]);
    }
  };

  const subscribe = (
    field: "blockerUid" | "blockedUid",
    side: "outgoing" | "incoming"
  ) =>
    onSnapshot(
      query(collection(db, BLOCKS), where(field, "==", uid)),
      (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === "removed") {
            docsById.delete(change.doc.id);
          } else {
            docsById.set(change.doc.id, change.doc.data() as Block);
          }
        }
        seen[side] = true;
        emit();
      },
      (error) => {
        onError?.(error);
      }
    );

  const unsubOutgoing = subscribe("blockerUid", "outgoing");
  const unsubIncoming = subscribe("blockedUid", "incoming");
  return () => {
    unsubOutgoing();
    unsubIncoming();
  };
}

export interface BlockSets {
  /** uids the current user has blocked (outgoing). */
  blockedByMe: Set<string>;
  /** uids that have blocked the current user (incoming). */
  blockedMe: Set<string>;
}

/** Splits raw block records into the two uid sets screens filter against. */
export function toBlockSets(currentUid: string, blocks: Block[]): BlockSets {
  const blockedByMe = new Set<string>();
  const blockedMe = new Set<string>();
  for (const block of blocks) {
    if (block.blockerUid === currentUid) blockedByMe.add(block.blockedUid);
    if (block.blockedUid === currentUid) blockedMe.add(block.blockerUid);
  }
  return { blockedByMe, blockedMe };
}

/** True when `otherUid` should be hidden from the current user. */
export function isUidBlocked(sets: BlockSets, otherUid: string): boolean {
  return sets.blockedByMe.has(otherUid) || sets.blockedMe.has(otherUid);
}

export async function reportUser(
  reporterUid: string,
  reportedUid: string,
  reason: string
): Promise<void> {
  const db = getConfiguredDb();
  const report: Report = {
    reporterUid,
    reportedUid,
    reason,
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, "reports"), report);
}
