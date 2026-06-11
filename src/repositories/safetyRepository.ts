import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { requireDb } from "../firebase/config";
import type { Block, Report } from "../types/domain";

export function buildBlockId(blockerUid: string, blockedUid: string): string {
  return `${blockerUid}_${blockedUid}`;
}

export async function blockUser(
  blockerUid: string,
  blockedUid: string
): Promise<void> {
  const db = requireDb();
  const block: Block = {
    blockerUid,
    blockedUid,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "blocks", buildBlockId(blockerUid, blockedUid)), block);
}

export async function reportUser(
  reporterUid: string,
  reportedUid: string,
  reason: string
): Promise<void> {
  const db = requireDb();
  const report: Report = {
    reporterUid,
    reportedUid,
    reason,
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, "reports"), report);
}
