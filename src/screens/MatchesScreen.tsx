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
import { useAuth } from "../context/AuthContext";
import { hasFirebaseConfig } from "../firebase/config";
import { listenMatchesForUser } from "../repositories/matchRepository";
import { getProfile } from "../repositories/profileRepository";
import {
  isUidBlocked,
  listenBlocksForUser,
  toBlockSets,
  type BlockSets,
} from "../repositories/safetyRepository";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { Match } from "../types/domain";
import type { RootStackParamList } from "../types/navigation";
import { logDevError } from "../utils/logging";

const EMPTY_BLOCK_SETS: BlockSets = {
  blockedByMe: new Set<string>(),
  blockedMe: new Set<string>(),
};

interface MatchRow {
  match: Match;
  partnerUid: string;
  partnerName: string;
}

export function MatchesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser } = useAuth();
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
    const nameCache = new Map<string, string>();
    const unsubscribe = listenMatchesForUser(
      currentUser.uid,
      (matches) => {
        (async () => {
          const next = await Promise.all(
            matches.map(async (match) => {
              const partnerUid =
                match.memberUids.find((uid) => uid !== currentUser.uid) ?? "";
              let partnerName = nameCache.get(partnerUid) ?? "";
              if (!partnerName && partnerUid) {
                try {
                  const partner = await getProfile(partnerUid);
                  partnerName = partner?.displayName ?? "Partner";
                } catch (e) {
                  logDevError("MatchesScreen.partnerProfile", e);
                  partnerName = "Partner";
                }
                nameCache.set(partnerUid, partnerName);
              }
              return { match, partnerUid, partnerName };
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
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() =>
            navigation.navigate("Chat", {
              matchId: item.match.matchId,
              partnerName: item.partnerName,
            })
          }
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.partnerName.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.name}>{item.partnerName}</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.match.lastMessage ?? "Say hello!"}
            </Text>
          </View>
        </Pressable>
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
  pressed: {
    opacity: 0.8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  rowText: {
    flex: 1,
  },
  name: {
    ...typography.subtitle,
    fontSize: 16,
  },
  lastMessage: {
    ...typography.caption,
    marginTop: 2,
  },
});
