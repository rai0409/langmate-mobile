import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, hasFirebaseConfig } from "../firebase/config";
import { invalidateCurrentExpoPushToken } from "../repositories/pushTokenRepository";

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function notConfiguredError(): Error {
  return new Error(
    "Firebase is not configured. Copy .env.example to .env and fill in your Firebase settings."
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(hasFirebaseConfig());

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      loading,
      signIn: async (email, password) => {
        if (!auth) throw notConfiguredError();
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        return credential.user;
      },
      signUp: async (email, password) => {
        if (!auth) throw notConfiguredError();
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        return credential.user;
      },
      signOut: async () => {
        if (!auth) throw notConfiguredError();
        if (currentUser) await invalidateCurrentExpoPushToken(currentUser.uid);
        await firebaseSignOut(auth);
      },
    }),
    [currentUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
