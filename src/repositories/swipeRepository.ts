import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireDb } from "../firebase/config";
import type { Swipe, SwipeAction } from "../types/domain";

const SWIPES = "swipes";

export function buildSwipeId(fromUid: string, toUid: string): string {
  return `${fromUid}_${toUid}`;
}

export async function createSwipe(
  fromUid: string,
  toUid: string,
  action: SwipeAction
): Promise<void> {
  const db = requireDb();
  const swipe: Swipe = {
    fromUid,
    toUid,
    action,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, SWIPES, buildSwipeId(fromUid, toUid)), swipe);
}

export async function getSwipe(
  fromUid: string,
  toUid: string
): Promise<Swipe | null> {
  const db = requireDb();
  const snapshot = await getDoc(
    doc(db, SWIPES, buildSwipeId(fromUid, toUid))
  );
  return snapshot.exists() ? (snapshot.data() as Swipe) : null;
}
