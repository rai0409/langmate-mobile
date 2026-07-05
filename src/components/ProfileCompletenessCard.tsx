import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { Profile } from "../types/domain";
import {
  nativeLanguagesForProfile,
  targetLanguagesForProfile,
} from "../utils/profileLanguages";

interface ProfileCompletenessCardProps {
  profile: Profile | null | undefined;
}

interface ChecklistItem {
  label: string;
  complete: boolean;
}

function buildChecklist(profile: Profile | null | undefined): ChecklistItem[] {
  const hasLanguages = profile
    ? nativeLanguagesForProfile(profile).length > 0 &&
      targetLanguagesForProfile(profile).length > 0
    : false;

  return [
    {
      label: "Display name",
      complete: Boolean(profile?.displayName?.trim()),
    },
    {
      label: "Native and learning languages",
      complete: hasLanguages,
    },
    {
      label: "Bio",
      complete: Boolean(profile?.bio?.trim()),
    },
    {
      label: "Interests",
      complete: Boolean(profile?.interests?.length),
    },
    {
      label: "Availability",
      complete: Boolean(profile?.availableTimes?.length),
    },
    {
      label: "Profile photo",
      complete: Boolean(profile?.photoURL || profile?.avatarUrl),
    },
  ];
}

export function ProfileCompletenessCard({
  profile,
}: ProfileCompletenessCardProps) {
  const checklist = buildChecklist(profile);
  const completedCount = checklist.filter((item) => item.complete).length;
  const percent = Math.round((completedCount / checklist.length) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Private beta profile</Text>
          <Text style={styles.caption}>
            {completedCount} of {checklist.length} profile signals complete
          </Text>
        </View>
        <Text style={styles.percent}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.checklist}>
        {checklist.map((item) => (
          <View key={item.label} style={styles.item}>
            <Text style={[styles.mark, item.complete ? styles.done : styles.todo]}>
              {item.complete ? "OK" : "--"}
            </Text>
            <Text
              style={[styles.itemText, !item.complete && styles.itemTextMuted]}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  title: {
    ...typography.subtitle,
    fontSize: 16,
  },
  caption: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  percent: {
    ...typography.subtitle,
    color: colors.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  checklist: {
    marginTop: spacing.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  mark: {
    width: 28,
    fontSize: 12,
    fontWeight: "700",
  },
  done: {
    color: colors.accent,
  },
  todo: {
    color: colors.textMuted,
  },
  itemText: {
    ...typography.caption,
    color: colors.text,
  },
  itemTextMuted: {
    color: colors.textMuted,
  },
});
