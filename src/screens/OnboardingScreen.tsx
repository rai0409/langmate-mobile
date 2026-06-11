import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { AppButton } from "../components/AppButton";
import { AppTextInput } from "../components/AppTextInput";
import { Chip } from "../components/Chip";
import {
  AVAILABILITY_OPTIONS,
  LANGUAGE_OPTIONS,
  LEARNING_GOAL_OPTIONS,
  LEVEL_OPTIONS,
} from "../constants/options";
import { useAuth } from "../context/AuthContext";
import { upsertProfile } from "../repositories/profileRepository";
import { colors, spacing, typography } from "../theme/theme";
import type {
  AvailabilitySlot,
  LanguageCode,
  LearningGoal,
  Profile,
  UserLevel,
} from "../types/domain";
import { errorMessage, notify } from "../utils/notify";

interface OnboardingScreenProps {
  existingProfile?: Profile | null;
  onSaved?: () => void;
}

export function OnboardingScreen({
  existingProfile,
  onSaved,
}: OnboardingScreenProps) {
  const { currentUser } = useAuth();

  const [displayName, setDisplayName] = useState(
    existingProfile?.displayName ?? ""
  );
  const [nativeLang, setNativeLang] = useState<LanguageCode | null>(
    existingProfile?.nativeLang ?? null
  );
  const [targetLang, setTargetLang] = useState<LanguageCode | null>(
    existingProfile?.targetLang ?? null
  );
  const [level, setLevel] = useState<UserLevel | null>(
    existingProfile?.level ?? null
  );
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(
    existingProfile?.learningGoal ?? null
  );
  const [interestsText, setInterestsText] = useState(
    (existingProfile?.interests ?? []).join(", ")
  );
  const [availableTimes, setAvailableTimes] = useState<AvailabilitySlot[]>(
    existingProfile?.availableTimes ?? []
  );
  const [country, setCountry] = useState(existingProfile?.country ?? "");
  const [bio, setBio] = useState(existingProfile?.bio ?? "");
  const [isDiscoverable, setIsDiscoverable] = useState(
    existingProfile?.isDiscoverable ?? true
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const toggleAvailability = (slot: AvailabilitySlot) => {
    setAvailableTimes((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const sameLangWarning =
    nativeLang && targetLang && nativeLang === targetLang
      ? "Your native and target languages are the same. You can continue, but partner matching works best when they differ."
      : null;

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    if (!displayName.trim()) nextErrors.displayName = "Display name is required.";
    if (!nativeLang) nextErrors.nativeLang = "Native language is required.";
    if (!targetLang) nextErrors.targetLang = "Target language is required.";
    if (!level) nextErrors.level = "Level is required.";
    if (!learningGoal) nextErrors.learningGoal = "Learning goal is required.";
    if (!bio.trim()) nextErrors.bio = "Bio is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!currentUser) {
      notify("Not signed in", "Please sign in again.");
      return;
    }

    setBusy(true);
    try {
      const interests = interestsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await upsertProfile(currentUser.uid, {
        displayName: displayName.trim(),
        nativeLang: nativeLang!,
        targetLang: targetLang!,
        level: level!,
        learningGoal: learningGoal!,
        interests,
        availableTimes,
        country: country.trim() || undefined,
        bio: bio.trim(),
        isDiscoverable,
        ...(existingProfile?.createdAt !== undefined
          ? { createdAt: existingProfile.createdAt }
          : {}),
      });
      onSaved?.();
    } catch (e) {
      notify("Could not save profile", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {existingProfile ? "Edit your profile" : "Set up your profile"}
      </Text>
      <Text style={styles.subtitle}>
        This is how partners will discover you.
      </Text>

      <AppTextInput
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="e.g. Aki"
        error={errors.displayName}
      />

      <SectionLabel label="Native language" error={errors.nativeLang} />
      <View style={styles.chipRow}>
        {LANGUAGE_OPTIONS.map((o) => (
          <Chip
            key={`native-${o.value}`}
            label={o.label}
            selected={nativeLang === o.value}
            onPress={() => setNativeLang(o.value)}
          />
        ))}
      </View>

      <SectionLabel label="Language you are learning" error={errors.targetLang} />
      <View style={styles.chipRow}>
        {LANGUAGE_OPTIONS.map((o) => (
          <Chip
            key={`target-${o.value}`}
            label={o.label}
            selected={targetLang === o.value}
            onPress={() => setTargetLang(o.value)}
          />
        ))}
      </View>

      {sameLangWarning ? (
        <Text style={styles.warning}>{sameLangWarning}</Text>
      ) : null}

      <SectionLabel label="Your level in that language" error={errors.level} />
      <View style={styles.chipRow}>
        {LEVEL_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={level === o.value}
            onPress={() => setLevel(o.value)}
          />
        ))}
      </View>

      <SectionLabel label="Learning goal" error={errors.learningGoal} />
      <View style={styles.chipRow}>
        {LEARNING_GOAL_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={learningGoal === o.value}
            onPress={() => setLearningGoal(o.value)}
          />
        ))}
      </View>

      <AppTextInput
        label="Interests (comma separated)"
        value={interestsText}
        onChangeText={setInterestsText}
        placeholder="music, travel, food"
      />

      <SectionLabel label="When are you usually available?" />
      <View style={styles.chipRow}>
        {AVAILABILITY_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={availableTimes.includes(o.value)}
            onPress={() => toggleAvailability(o.value)}
          />
        ))}
      </View>

      <AppTextInput
        label="Country (optional)"
        value={country}
        onChangeText={setCountry}
        placeholder="e.g. Japan"
      />

      <AppTextInput
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Tell partners about yourself and what you want to practice."
        multiline
        error={errors.bio}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={typography.body}>Show me in Discover</Text>
          <Text style={typography.caption}>
            Turn off to hide your profile from other learners.
          </Text>
        </View>
        <Switch
          value={isDiscoverable}
          onValueChange={setIsDiscoverable}
          trackColor={{ true: colors.accent, false: colors.border }}
        />
      </View>

      <AppButton
        title={busy ? "Saving..." : "Save profile"}
        onPress={save}
        disabled={busy}
      />
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function SectionLabel({ label, error }: { label: string; error?: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{label}</Text>
      {error ? <Text style={styles.sectionError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  sectionLabelText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text,
  },
  sectionError: {
    ...typography.caption,
    color: colors.danger,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg,
  },
  warning: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.lg,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  toggleText: {
    flex: 1,
    marginRight: spacing.lg,
  },
  bottomSpace: {
    height: spacing.xxl,
  },
});
