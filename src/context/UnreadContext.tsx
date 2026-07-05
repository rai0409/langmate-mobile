import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { hasFirebaseConfig } from "../firebase/config";
import { listenMatchesForUser } from "../repositories/matchRepository";
import { listenMemberState } from "../repositories/memberStateRepository";
import { logDevError } from "../utils/logging";
import { useAuth } from "./AuthContext";

interface UnreadContextValue {
  totalUnreadCount: number;
}

const UnreadContext = createContext<UnreadContextValue | undefined>(undefined);

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [unreadByMatch, setUnreadByMatch] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUser || !hasFirebaseConfig()) {
      setUnreadByMatch({});
      return;
    }

    const memberStateUnsubscribes = new Map<string, () => void>();
    const unsubscribeMatches = listenMatchesForUser(
      currentUser.uid,
      (matches) => {
        const matchIds = new Set(matches.map((match) => match.matchId));
        for (const [matchId, unsubscribe] of memberStateUnsubscribes) {
          if (!matchIds.has(matchId)) {
            unsubscribe();
            memberStateUnsubscribes.delete(matchId);
            setUnreadByMatch((prev) => {
              const next = { ...prev };
              delete next[matchId];
              return next;
            });
          }
        }
        for (const match of matches) {
          if (memberStateUnsubscribes.has(match.matchId)) continue;
          const unsubscribe = listenMemberState(
            match.matchId,
            currentUser.uid,
            (state) => {
              setUnreadByMatch((prev) => ({
                ...prev,
                [match.matchId]: state.unreadCount,
              }));
            },
            (error) => {
              logDevError("UnreadProvider.listenMemberState", error);
            }
          );
          memberStateUnsubscribes.set(match.matchId, unsubscribe);
        }
      },
      (error) => {
        logDevError("UnreadProvider.listenMatches", error);
      }
    );

    return () => {
      unsubscribeMatches();
      memberStateUnsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [currentUser]);

  const totalUnreadCount = useMemo(
    () =>
      Object.values(unreadByMatch).reduce(
        (total, unreadCount) => total + Math.max(0, unreadCount),
        0
      ),
    [unreadByMatch]
  );

  const value = useMemo(
    () => ({ totalUnreadCount }),
    [totalUnreadCount]
  );

  return (
    <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>
  );
}

export function useUnreadCounts(): UnreadContextValue {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error("useUnreadCounts must be used inside an UnreadProvider");
  }
  return context;
}
