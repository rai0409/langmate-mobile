import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// EXPO_PUBLIC_* vars must be referenced with static dot notation so the
// Expo bundler can inline them.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const appEnvironment = process.env.EXPO_PUBLIC_APP_ENV;
const productionProjectId = process.env.EXPO_PUBLIC_PRODUCTION_FIREBASE_PROJECT_ID;
const VALID_APP_ENVIRONMENTS = ['local', 'staging', 'production'] as const;
type AppEnvironment = (typeof VALID_APP_ENVIRONMENTS)[number];

function isAppEnvironment(value: string | undefined): value is AppEnvironment {
  return VALID_APP_ENVIRONMENTS.includes(value as AppEnvironment);
}

function firebaseConfigError(): string | null {
  if (!isAppEnvironment(appEnvironment)) return 'Firebase environment is missing or invalid.';
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.storageBucket ||
    !firebaseConfig.messagingSenderId ||
    !firebaseConfig.appId
  ) {
    return 'Firebase public configuration is incomplete.';
  }
  if (
    appEnvironment === 'production' &&
    /(^|[-_])(demo|example|test)([-_]|$)/i.test(firebaseConfig.projectId)
  ) {
    return 'Production Firebase configuration uses a reserved demo project identifier.';
  }
  if (
    appEnvironment === 'staging' &&
    productionProjectId &&
    firebaseConfig.projectId === productionProjectId
  ) {
    return 'Staging Firebase configuration matches the declared production project.';
  }
  return null;
}

export function getFirebaseConfigurationError(): string | null {
  return firebaseConfigError();
}

export function getAppEnvironment(): AppEnvironment | null {
  return isAppEnvironment(appEnvironment) ? appEnvironment : null;
}

export function hasFirebaseConfig(): boolean {
  return firebaseConfigError() === null;
}

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

const firebaseAuthWithReactNativePersistence = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
};

function initializeFirebaseAuth(app: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return FirebaseAuth.getAuth(app);
  }

  const getReactNativePersistence =
    firebaseAuthWithReactNativePersistence.getReactNativePersistence;
  if (!getReactNativePersistence) {
    throw new Error('Firebase Auth React Native persistence is unavailable in this runtime.');
  }

  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return FirebaseAuth.getAuth(app);
  }
}

if (hasFirebaseConfig()) {
  firebaseApp =
    getApps()[0] ??
    initializeApp({
      apiKey: firebaseConfig.apiKey!,
      authDomain: firebaseConfig.authDomain!,
      projectId: firebaseConfig.projectId!,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId!,
    });
  auth = initializeFirebaseAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
}

export { firebaseApp, auth, db, storage };

export function requireAuth(): Auth {
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env and fill in your Firebase settings.',
    );
  }
  return auth;
}

export function requireDb(): Firestore {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env and fill in your Firebase settings.',
    );
  }
  return db;
}

export function requireStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env and fill in your Firebase settings.',
    );
  }
  return storage;
}
