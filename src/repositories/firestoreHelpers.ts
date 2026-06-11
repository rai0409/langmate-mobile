import type { Firestore } from "firebase/firestore";
import { db, hasFirebaseConfig } from "../firebase/config";

export const FIREBASE_NOT_CONFIGURED_MESSAGE =
  "Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* values to .env and restart Expo.";

/**
 * Repository-layer Firestore accessor. Importing this module never touches
 * Firebase; the error is thrown only when a repository function actually
 * runs without configuration, with a message that tells the user how to fix it.
 */
export function getConfiguredDb(): Firestore {
  if (!hasFirebaseConfig() || !db) {
    throw new Error(FIREBASE_NOT_CONFIGURED_MESSAGE);
  }
  return db;
}
