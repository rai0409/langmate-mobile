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
} from 'firebase/firestore';
import { getConfiguredDb, removeUndefinedFields } from './firestoreHelpers';
import {
  PROFILE_BIO_MAX,
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_INTERESTS_MAX,
} from '../config/inputLimits';
import type { Profile } from '../types/domain';

// Main profile documents always live at profiles/{uid}. Never addDoc here.
const PROFILES = 'profiles';

export async function getProfile(uid: string): Promise<Profile | null> {
  const db = getConfiguredDb();
  const snapshot = await getDoc(doc(db, PROFILES, uid));
  if (!snapshot.exists()) return null;
  return { ...(snapshot.data() as Profile), uid };
}

export async function upsertProfile(uid: string, profilePatch: Partial<Profile>): Promise<void> {
  if (
    (profilePatch.displayName !== undefined &&
      profilePatch.displayName.length > PROFILE_DISPLAY_NAME_MAX) ||
    (profilePatch.bio !== undefined && profilePatch.bio.length > PROFILE_BIO_MAX) ||
    (profilePatch.interests !== undefined &&
      profilePatch.interests.length > PROFILE_INTERESTS_MAX) ||
    (profilePatch.nativeLangs !== undefined &&
      (profilePatch.nativeLangs.length < 1 || profilePatch.nativeLangs.length > 2)) ||
    (profilePatch.targetLangs !== undefined &&
      (profilePatch.targetLangs.length < 1 || profilePatch.targetLangs.length > 3))
  ) {
    throw new Error('Profile input exceeds supported limits.');
  }
  const db = getConfiguredDb();
  // Optional fields (country, avatarUrl, …) may arrive as undefined from the
  // form; Firestore rejects undefined values, so they are omitted entirely.
  await setDoc(
    doc(db, PROFILES, uid),
    removeUndefinedFields({
      ...profilePatch,
      uid,
      updatedAt: serverTimestamp(),
      ...(profilePatch.createdAt === undefined ? { createdAt: serverTimestamp() } : {}),
    }),
    { merge: true },
  );
}

export function listenProfile(
  uid: string,
  callback: (profile: Profile | null) => void,
): () => void {
  const db = getConfiguredDb();
  return onSnapshot(doc(db, PROFILES, uid), (snapshot) => {
    callback(snapshot.exists() ? { ...(snapshot.data() as Profile), uid } : null);
  });
}

export const DISCOVER_QUERY_LIMIT = 50;

/**
 * Returns up to `limitCount` discoverable profiles. Real Firestore data only —
 * mock/preview profiles never come from this function.
 */
export async function listDiscoverableProfiles(
  limitCount: number = DISCOVER_QUERY_LIMIT,
): Promise<Profile[]> {
  const db = getConfiguredDb();
  const snapshot = await getDocs(
    query(collection(db, PROFILES), where('isDiscoverable', '==', true), limit(limitCount)),
  );
  return snapshot.docs.map((d) => ({ ...(d.data() as Profile), uid: d.id }));
}
