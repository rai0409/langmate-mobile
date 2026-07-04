import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "../components/EmptyState";
import { LoadingScreen } from "../components/LoadingScreen";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { useAuth } from "../context/AuthContext";
import { useCurrentProfile } from "../context/ProfileContext";
import { hasFirebaseConfig } from "../firebase/config";
import { listenMatchesForUser } from "../repositories/matchRepository";
import { getProfile } from "../repositories/profileRepository";
import {
  isUidBlocked,
  listenBlocksForUser,
  toBlockSets,
  type BlockSets,
} from "../repositories/safetyRepository";
import { calculateMatchScore } from "../services/matchingService";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { Match, Profile } from "../types/domain";
import type { RootStackParamList } from "../types/navigation";
import { logDevError } from "../utils/logging";
import { notify } from "../utils/notify";

const EMPTY_BLOCK_SETS: BlockSets = {
  blockedByMe: new Set<string>(),
  blockedMe: new Set<string>(),
};

interface MatchRow {
  match: Match;
  partnerUid: string;
  partnerName: string;
  partnerProfile: Profile | null;
}

export function MatchesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser } = useAuth();
  const { profile: currentProfile } = useCurrentProfile();
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockSets, setBlockSets] = useState<BlockSets>(EMPTY_BLOCK_SETS);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !hasFirebaseConfig()) {
      setRows([]);
      setLoading(false);
      return;
    }
    const profileCache = new Map<string, Profile | null>();
    const unsubscribe = listenMatchesForUser(
      currentUser.uid,
      (matches) => {
        (async () => {
          const next = await Promise.all(
            matches.map(async (match) => {
              const partnerUid =
                match.memberUids.find((uid) => uid !== currentUser.uid) ?? "";
              let partnerProfile = profileCache.get(partnerUid);
              if (partnerProfile === undefined && partnerUid) {
                try {
                  partnerProfile = await getProfile(partnerUid);
                } catch (e) {
                  logDevError("MatchesScreen.partnerProfile", e);
                  partnerProfile = null;
                }
                profileCache.set(partnerUid, partnerProfile);
              }
              return {
                match,
                partnerUid,
                partnerName: partnerProfile?.displayName ?? "Partner",
                partnerProfile: partnerProfile ?? null,
              };
            })
          );
          setRows(next);
          setLoading(false);
        })();
      },
      (error) => {
        logDevError("MatchesScreen.listenMatches", error);
        setWarning("Could not load matches. Pull down or reopen this tab to retry.");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [currentUser]);

  const openPartnerProfile = (row: MatchRow) => {
    if (!currentUser || !currentProfile) {
      notify("Profile unavailable", "Please reopen Matches and try again.");
      return;
    }
    if (!row.partnerUid || row.partnerUid === currentUser.uid) {
      notify("Profile unavailable", "This match does not have another profile to show.");
      return;
    }
    if (!row.partnerProfile) {
      notify(
        "Profile unavailable",
        "We could not load this partner's profile. You can still open the chat."
      );
      return;
    }
    navigation.navigate("UserDetail", {
      profile: row.partnerProfile,
      scoreResult: calculateMatchScore(currentProfile, row.partnerProfile),
    });
  };

  useEffect(() => {
    if (!currentUser || !hasFirebaseConfig()) {
      setBlockSets(EMPTY_BLOCK_SETS);
      return;
    }
    // Block filtering is best-effort: a failed block listener keeps the
    // screen usable and shows a warning instead of hiding all matches.
    const unsubscribe = listenBlocksForUser(
      currentUser.uid,
      (blocks) => {
        setBlockSets(toBlockSets(currentUser.uid, blocks));
      },
      (error) => {
        logDevError("MatchesScreen.listenBlocks", error);
        setWarning(
          "Could not load your block list — matches with blocked users may still appear."
        );
      }
    );
    return unsubscribe;
  }, [currentUser]);

  // Hide matches with a blocked partner (either direction). Rows whose
  // partner uid could not be resolved stay visible rather than crashing.
  const visibleRows = rows.filter(
    (row) => !row.partnerUid || !isUidBlocked(blockSets, row.partnerUid)
  );

  if (loading) {
    return <LoadingScreen message="Loading your matches..." />;
  }

  if (visibleRows.length === 0) {
    return (
      <View style={styles.screen}>
        {warning ? <Text style={styles.warning}>{warning}</Text> : null}
        <EmptyState
          title="No matches yet"
          message="When you and another learner both choose Connect, your match shows up here."
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={visibleRows}
      ListHeaderComponent={
        warning ? <Text style={styles.warning}>{warning}</Text> : null
      }
      keyExtractor={(row) => row.match.matchId}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [
              styles.profileTarget,
              pressed && styles.pressed,
            ]}
            onPress={() => openPartnerProfile(item)}
          >
            <View style={styles.avatarWrap}>
              <ProfileAvatar
                profile={item.partnerProfile}
                name={item.partnerName}
                size={44}
              />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.partnerName}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.match.lastMessage ?? "Say hello!"}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.chatButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate("Chat", {
                matchId: item.match.matchId,
                partnerName: item.partnerName,
              })
            }
          >
            <Text style={styles.chatButtonText}>Chat</Text>
          </Pressable>
        </View>
      )}
    />
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
  warning: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  profileTarget: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.8,
  },
  avatarWrap: {
    marginRight: spacing.md,
  },
  rowText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.subtitle,
    fontSize: 16,
  },
  lastMessage: {
    ...typography.caption,
    marginTop: 2,
  },
  chatButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chatButtonText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
  },
});
