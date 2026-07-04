import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { db, hasFirebaseConfig, storage } from "../firebase/config";

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

export function getConfiguredStorage(): FirebaseStorage {
  if (!hasFirebaseConfig() || !storage) {
    throw new Error(FIREBASE_NOT_CONFIGURED_MESSAGE);
  }
  return storage;
}

/**
 * Drops keys whose value is exactly `undefined` — Firestore setDoc/updateDoc
 * reject undefined field values. Keeps false, 0, "", null, and empty arrays.
 * Shallow on purpose: write payloads here are flat documents.
 */
export function removeUndefinedFields<T extends Record<string, unknown>>(
  value: T
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    if (fieldValue !== undefined) {
      result[key] = fieldValue;
    }
  }
  return result as Partial<T>;
}
