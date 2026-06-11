import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../components/EmptyState";
import { LoadingScreen } from "../components/LoadingScreen";
import { ProfileCard } from "../components/ProfileCard";
import { useAuth } from "../context/AuthContext";
import { useCurrentProfile } from "../context/ProfileContext";
import { hasFirebaseConfig } from "../firebase/config";
import { MOCK_CURRENT_PROFILE, MOCK_PROFILES } from "../lib/mockData";
import { createMatchIfMutualConnect } from "../repositories/matchRepository";
import { listDiscoverableProfiles } from "../repositories/profileRepository";
import {
  isUidBlocked,
  listBlocksForUser,
  toBlockSets,
  type BlockSets,
} from "../repositories/safetyRepository";
import { createSwipe } from "../repositories/swipeRepository";
import {
  filterAndRankCandidates,
  type RankedCandidate,
} from "../services/matchingService";
import { colors, spacing, typography } from "../theme/theme";
import type { RootStackParamList } from "../types/navigation";
import { getErrorMessage } from "../utils/errorMessage";
import { logDevError } from "../utils/logging";
import { notify } from "../utils/notify";

const PREVIEW_LABEL = "Preview data";

export function DiscoverScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser } = useAuth();
  const { profile } = useCurrentProfile();

  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hiddenUids, setHiddenUids] = useState<Set<string>>(new Set());
  const [blockWarning, setBlockWarning] = useState<string | null>(null);

  const currentProfile = profile ?? MOCK_CURRENT_PROFILE;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let pool: { profiles: typeof MOCK_PROFILES; preview: boolean } = {
        profiles: MOCK_PROFILES,
        preview: true,
      };
      if (hasFirebaseConfig()) {
        // Block filtering is best-effort here: if the block query fails,
        // Discover still renders, with a visible warning instead of a crash.
        let blockSets: BlockSets = {
          blockedByMe: new Set(),
          blockedMe: new Set(),
        };
        if (currentUser) {
          try {
            blockSets = toBlockSets(
              currentUser.uid,
              await listBlocksForUser(currentUser.uid)
            );
            setBlockWarning(null);
          } catch (e) {
            logDevError("DiscoverScreen.loadBlocks", e);
            setBlockWarning(
              "Could not load your block list — some blocked users may appear until you reload."
            );
          }
        }
        const real = await listDiscoverableProfiles();
        const others = real.filter(
          (p) =>
            p.uid !== currentUser?.uid && !isUidBlocked(blockSets, p.uid)
        );
        if (others.length > 0) {
          pool = { profiles: others, preview: false };
        }
      }
      setIsPreview(pool.preview);
      setCandidates(filterAndRankCandidates(currentProfile, pool.profiles));
    } catch (e) {
      logDevError("DiscoverScreen.load", e);
      notify("Could not load profiles", getErrorMessage(e));
      setIsPreview(true);
      setCandidates(filterAndRankCandidates(currentProfile, MOCK_PROFILES));
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const hide = (uid: string) => {
    setHiddenUids((prev) => new Set(prev).add(uid));
  };

  const handleSkip = async (candidate: RankedCandidate) => {
    hide(candidate.profile.uid);
    if (isPreview || !hasFirebaseConfig() || !currentUser) return;
    try {
      await createSwipe(currentUser.uid, candidate.profile.uid, "skip");
    } catch (e) {
      logDevError("DiscoverScreen.skip", e);
      notify("Could not save skip", getErrorMessage(e));
    }
  };

  const handleConnect = async (candidate: RankedCandidate) => {
    if (isPreview || !hasFirebaseConfig() || !currentUser) {
      notify(
        "Preview data",
        "These are sample profiles. Connect works once Firebase is set up and real users join."
      );
      hide(candidate.profile.uid);
      return;
    }
    hide(candidate.profile.uid);
    try {
      await createSwipe(currentUser.uid, candidate.profile.uid, "connect");
      const match = await createMatchIfMutualConnect(
        currentUser.uid,
        candidate.profile.uid
      );
      if (match) {
        notify(
          "It's a match!",
          `You and ${candidate.profile.displayName} both want to connect. Say hello in Matches.`
        );
      } else {
        notify(
          "Connect request sent",
          `If ${candidate.profile.displayName} also connects with you, a match opens.`
        );
      }
    } catch (e) {
      logDevError("DiscoverScreen.connect", e);
      notify("Could not connect", getErrorMessage(e));
    }
  };

  const visible = candidates.filter((c) => !hiddenUids.has(c.profile.uid));

  if (loading) {
    return <LoadingScreen message="Finding language partners..." />;
  }

  return (
    <View style={styles.screen}>
      {blockWarning ? (
        <Text style={styles.blockWarning}>{blockWarning}</Text>
      ) : null}
      {visible.length === 0 ? (
        <EmptyState
          title="No more partners right now"
          message="You have seen everyone available. Pull to refresh or check back later."
          actionTitle="Reload"
          onAction={() => {
            setHiddenUids(new Set());
            load();
          }}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.profile.uid}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          ListHeaderComponent={
            isPreview ? (
              <Text style={styles.previewNote}>
                Showing preview data — set up Firebase (or wait for real users)
                to discover actual partners.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <ProfileCard
              profile={item.profile}
              scoreResult={item.scoreResult}
              previewLabel={isPreview ? PREVIEW_LABEL : undefined}
              onSkip={() => handleSkip(item)}
              onConnect={() => handleConnect(item)}
              onViewProfile={() =>
                navigation.navigate("UserDetail", {
                  profile: item.profile,
                  scoreResult: item.scoreResult,
                  isPreview,
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
  },
  previewNote: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  blockWarning: {
    ...typography.caption,
    color: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
