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
import type { Profile } from "../types/domain";

// Main profile documents always live at profiles/{uid}. Never addDoc here.
const PROFILES = "profiles";

export async function getProfile(uid: string): Promise<Profile | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, PROFILES, uid));
  if (!snapshot.exists()) return null;
  return { ...(snapshot.data() as Profile), uid };
}

export async function upsertProfile(
  uid: string,
  profilePatch: Partial<Profile>
): Promise<void> {
  const db = requireDb();
  await setDoc(
    doc(db, PROFILES, uid),
    {
      ...profilePatch,
      uid,
      updatedAt: serverTimestamp(),
      ...(profilePatch.createdAt === undefined
        ? { createdAt: serverTimestamp() }
        : {}),
    },
    { merge: true }
  );
}

export function listenProfile(
  uid: string,
  callback: (profile: Profile | null) => void
): () => void {
  const db = requireDb();
  return onSnapshot(doc(db, PROFILES, uid), (snapshot) => {
    callback(
      snapshot.exists() ? { ...(snapshot.data() as Profile), uid } : null
    );
  });
}

export async function listDiscoverableProfiles(): Promise<Profile[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, PROFILES), where("isDiscoverable", "==", true))
  );
  return snapshot.docs.map((d) => ({ ...(d.data() as Profile), uid: d.id }));
}
