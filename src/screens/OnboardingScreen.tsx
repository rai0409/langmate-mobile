import React, { useEffect, useState } from "react";
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
import { getPlanLimits } from "../config/planLimits";
import { useAuth } from "../context/AuthContext";
import { getUserPlan } from "../repositories/entitlementRepository";
import { upsertProfile } from "../repositories/profileRepository";
import { colors, spacing, typography } from "../theme/theme";
import type {
  AvailabilitySlot,
  LanguageCode,
  LearningGoal,
  Profile,
  Plan,
  UserLevel,
} from "../types/domain";
import { logAppError } from "../utils/errorLogging";
import { errorMessage, notify } from "../utils/notify";
import {
  nativeLanguagesForProfile,
  targetLanguagesForProfile,
} from "../utils/profileLanguages";

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
  const [plan, setPlan] = useState<Plan>("free");
  const [nativeLangs, setNativeLangs] = useState<LanguageCode[]>(
    existingProfile ? nativeLanguagesForProfile(existingProfile) : []
  );
  const [targetLangs, setTargetLangs] = useState<LanguageCode[]>(
    existingProfile ? targetLanguagesForProfile(existingProfile) : []
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
  const planLimits = getPlanLimits(plan);

  useEffect(() => {
    if (!currentUser) {
      setPlan("free");
      return;
    }
    let cancelled = false;
    getUserPlan(currentUser.uid).then((nextPlan) => {
      if (!cancelled) setPlan(nextPlan);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const toggleAvailability = (slot: AvailabilitySlot) => {
    setAvailableTimes((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const toggleLimitedLanguage = (
    language: LanguageCode,
    selectedLanguages: LanguageCode[],
    setSelectedLanguages: React.Dispatch<React.SetStateAction<LanguageCode[]>>,
    limit: number
  ) => {
    if (selectedLanguages.includes(language)) {
      setSelectedLanguages((prev) => prev.filter((item) => item !== language));
      return;
    }
    if (selectedLanguages.length >= limit) {
      notify(
        "Premium language limit",
        "Premium will allow you to add more languages. Payments are not enabled in this MVP yet."
      );
      return;
    }
    setSelectedLanguages((prev) => [...prev, language]);
  };

  const sameLangWarning =
    nativeLangs.some((language) => targetLangs.includes(language))
      ? "Your native and target languages are the same. You can continue, but partner matching works best when they differ."
      : null;

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    if (!displayName.trim()) nextErrors.displayName = "Display name is required.";
    if (nativeLangs.length === 0) {
      nextErrors.nativeLang = "Native language is required.";
    } else if (nativeLangs.length > planLimits.nativeLanguages) {
      nextErrors.nativeLang =
        "Premium will allow you to add more languages. Payments are not enabled in this MVP yet.";
    }
    if (targetLangs.length === 0) {
      nextErrors.targetLang = "Target language is required.";
    } else if (targetLangs.length > planLimits.targetLanguages) {
      nextErrors.targetLang =
        "Premium will allow you to add more languages. Payments are not enabled in this MVP yet.";
    }
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
        nativeLang: nativeLangs[0]!,
        targetLang: targetLangs[0]!,
        nativeLangs,
        targetLangs,
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
      logAppError("profile_save_failed", e, {
        mode: existingProfile ? "edit" : "create",
      });
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
      <Text style={styles.limitHint}>
        {plan === "premium" ? "Premium" : "Free"} plan: up to{" "}
        {planLimits.nativeLanguages} native language
        {planLimits.nativeLanguages === 1 ? "" : "s"}.
      </Text>
      <View style={styles.chipRow}>
        {LANGUAGE_OPTIONS.map((o) => (
          <Chip
            key={`native-${o.value}`}
            label={o.label}
            selected={nativeLangs.includes(o.value)}
            onPress={() =>
              toggleLimitedLanguage(
                o.value,
                nativeLangs,
                setNativeLangs,
                planLimits.nativeLanguages
              )
            }
          />
        ))}
      </View>

      <SectionLabel label="Language you are learning" error={errors.targetLang} />
      <Text style={styles.limitHint}>
        {plan === "premium" ? "Premium" : "Free"} plan: up to{" "}
        {planLimits.targetLanguages} target language
        {planLimits.targetLanguages === 1 ? "" : "s"}.
      </Text>
      <View style={styles.chipRow}>
        {LANGUAGE_OPTIONS.map((o) => (
          <Chip
            key={`target-${o.value}`}
            label={o.label}
            selected={targetLangs.includes(o.value)}
            onPress={() =>
              toggleLimitedLanguage(
                o.value,
                targetLangs,
                setTargetLangs,
                planLimits.targetLanguages
              )
            }
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
  limitHint: {
    ...typography.caption,
    marginBottom: spacing.sm,
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
