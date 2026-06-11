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
import { colors, radius, spacing, typography } from "../theme/theme";
import type { Match } from "../types/domain";
import type { RootStackParamList } from "../types/navigation";

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

  useEffect(() => {
    if (!currentUser || !hasFirebaseConfig()) {
      setRows([]);
      setLoading(false);
      return;
    }
    const nameCache = new Map<string, string>();
    const unsubscribe = listenMatchesForUser(currentUser.uid, (matches) => {
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
              } catch {
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
    });
    return unsubscribe;
  }, [currentUser]);

  if (loading) {
    return <LoadingScreen message="Loading your matches..." />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        message="When you and another learner both choose Connect, your match shows up here."
      />
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={rows}
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
