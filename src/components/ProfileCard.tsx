import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  availabilityLabel,
  languageLabel,
  learningGoalLabel,
  levelLabel,
} from "../constants/options";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { MatchScoreResult, Profile } from "../types/domain";
import { AppButton } from "./AppButton";
import { Chip } from "./Chip";
import { MatchReasonList } from "./MatchReasonList";
import { ProfileAvatar } from "./ProfileAvatar";

interface ProfileCardProps {
  profile: Profile;
  scoreResult: MatchScoreResult;
  previewLabel?: string;
  onConnect: () => void;
  onSkip: () => void;
  onViewProfile: () => void;
}

export function ProfileCard({
  profile,
  scoreResult,
  previewLabel,
  onConnect,
  onSkip,
  onViewProfile,
}: ProfileCardProps) {
  return (
    <View style={styles.card}>
      {previewLabel ? (
        <View style={styles.previewBadge}>
          <Text style={styles.previewText}>{previewLabel}</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <ProfileAvatar profile={profile} size={52} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{profile.displayName}</Text>
          {profile.country ? (
            <Text style={styles.country}>{profile.country}</Text>
          ) : null}
        </View>
        <View style={styles.scoreBox}>
          {scoreResult.score !== null ? (
            <>
              <Text style={styles.scoreValue}>{scoreResult.score}</Text>
              <Text style={styles.scoreLabel}>match</Text>
            </>
          ) : (
            <Text style={styles.scoreMissing}>Needs more profile data</Text>
          )}
        </View>
      </View>

      <View style={styles.langRow}>
        <Text style={styles.langItem}>
          Native: {languageLabel(profile.nativeLang)}
        </Text>
        <Text style={styles.langItem}>
          Learning: {languageLabel(profile.targetLang)}
        </Text>
      </View>
      <View style={styles.langRow}>
        <Text style={styles.langItem}>Level: {levelLabel(profile.level)}</Text>
        <Text style={styles.langItem}>
          Goal: {learningGoalLabel(profile.learningGoal)}
        </Text>
      </View>

      {profile.interests.length > 0 ? (
        <View style={styles.chipRow}>
          {profile.interests.map((interest) => (
            <Chip key={interest} label={interest} />
          ))}
        </View>
      ) : null}

      {profile.availableTimes.length > 0 ? (
        <View style={styles.chipRow}>
          {profile.availableTimes.map((slot) => (
            <Chip key={slot} label={availabilityLabel(slot)} />
          ))}
        </View>
      ) : null}

      {scoreResult.whyMatched.length > 0 ||
      scoreResult.missingFields.length > 0 ? (
        <View style={styles.reasons}>
          <MatchReasonList
            reasons={scoreResult.whyMatched}
            missingFields={scoreResult.missingFields}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <AppButton title="Skip" onPress={onSkip} variant="secondary" />
        </View>
        <View style={styles.actionButton}>
          <AppButton title="Connect" onPress={onConnect} variant="primary" />
        </View>
      </View>
      <AppButton title="View Profile" onPress={onViewProfile} variant="ghost" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  previewBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  previewText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  name: {
    ...typography.subtitle,
  },
  country: {
    ...typography.caption,
  },
  scoreBox: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 140,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.accent,
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  scoreMissing: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
  langRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },
  langItem: {
    ...typography.body,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  reasons: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});
