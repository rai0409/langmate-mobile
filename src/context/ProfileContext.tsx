import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { hasFirebaseConfig } from "../firebase/config";
import { listenProfile } from "../repositories/profileRepository";
import type { Profile } from "../types/domain";
import { useAuth } from "./AuthContext";

interface ProfileContextValue {
  profile: Profile | null;
  profileLoading: boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !hasFirebaseConfig()) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const unsubscribe = listenProfile(currentUser.uid, (next) => {
      setProfile(next);
      setProfileLoading(false);
    });
    return unsubscribe;
  }, [currentUser]);

  const value = useMemo(
    () => ({ profile, profileLoading }),
    [profile, profileLoading]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useCurrentProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useCurrentProfile must be used inside a ProfileProvider");
  }
  return context;
}

export function isProfileComplete(profile: Profile | null): boolean {
  return Boolean(
    profile &&
      profile.displayName &&
      profile.nativeLang &&
      profile.targetLang &&
      profile.level &&
      profile.learningGoal &&
      profile.bio
  );
}
