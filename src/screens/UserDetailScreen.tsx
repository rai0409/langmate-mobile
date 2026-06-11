import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Chip } from "../components/Chip";
import { MatchReasonList } from "../components/MatchReasonList";
import {
  availabilityLabel,
  languageLabel,
  learningGoalLabel,
  levelLabel,
} from "../constants/options";
import { useAuth } from "../context/AuthContext";
import { hasFirebaseConfig } from "../firebase/config";
import { createMatchIfMutualConnect } from "../repositories/matchRepository";
import { blockUser, reportUser } from "../repositories/safetyRepository";
import { createSwipe } from "../repositories/swipeRepository";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { RootStackParamList } from "../types/navigation";
import { getErrorMessage } from "../utils/errorMessage";
import { logDevError } from "../utils/logging";
import { notify } from "../utils/notify";

type Props = NativeStackScreenProps<RootStackParamList, "UserDetail">;

export function UserDetailScreen({ route, navigation }: Props) {
  const { profile, scoreResult, isPreview } = route.params;
  const { currentUser } = useAuth();
  const [busy, setBusy] = useState(false);

  // Preview/mock profiles must never produce Firestore writes: every action
  // below goes through this guard before touching a repository.
  const guardWrites = (): boolean => {
    if (isPreview || !hasFirebaseConfig() || !currentUser) {
      notify(
        "Preview only — nothing was saved",
        "This is a sample profile shown in preview mode. Connect, Report, and Block start working once Firebase is set up and real users join."
      );
      return false;
    }
    return true;
  };

  const handleConnect = async () => {
    if (!guardWrites()) return;
    setBusy(true);
    try {
      await createSwipe(currentUser!.uid, profile.uid, "connect");
      const match = await createMatchIfMutualConnect(
        currentUser!.uid,
        profile.uid
      );
      if (match) {
        notify(
          "It's a match!",
          `You and ${profile.displayName} both want to connect. Say hello in Matches.`
        );
      } else {
        notify(
          "Connect request sent",
          `If ${profile.displayName} also connects with you, a match opens.`
        );
      }
    } catch (e) {
      logDevError("UserDetailScreen.connect", e);
      notify("Could not connect", getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleReport = async () => {
    if (!guardWrites()) return;
    setBusy(true);
    try {
      await reportUser(currentUser!.uid, profile.uid, "MVP report");
      notify("Report sent", "Thank you. Our team will review this profile.");
    } catch (e) {
      logDevError("UserDetailScreen.report", e);
      notify("Could not send report", getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleBlock = async () => {
    if (!guardWrites()) return;
    setBusy(true);
    try {
      await blockUser(currentUser!.uid, profile.uid);
      notify(
        "User blocked",
        `${profile.displayName} has been blocked and will be hidden from your Discover and Matches.`
      );
      navigation.goBack();
    } catch (e) {
      logDevError("UserDetailScreen.block", e);
      notify("Could not block user", getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {isPreview ? (
        <Text style={styles.previewNote}>Preview data — sample profile</Text>
      ) : null}

      <Text style={styles.name}>{profile.displayName}</Text>
      {profile.country ? (
        <Text style={styles.country}>{profile.country}</Text>
      ) : null}

      <View style={styles.scoreCard}>
        {scoreResult.score !== null ? (
          <Text style={styles.score}>Match score: {scoreResult.score}</Text>
        ) : (
          <Text style={styles.score}>Needs more profile data</Text>
        )}
        <MatchReasonList
          reasons={scoreResult.whyMatched}
          missingFields={scoreResult.missingFields}
        />
      </View>

      <Section title="Languages">
        <Text style={typography.body}>
          Native: {languageLabel(profile.nativeLang)}
        </Text>
        <Text style={typography.body}>
          Learning: {languageLabel(profile.targetLang)} (
          {levelLabel(profile.level)})
        </Text>
        <Text style={typography.body}>
          Goal: {learningGoalLabel(profile.learningGoal)}
        </Text>
      </Section>

      <Section title="About">
        <Text style={typography.body}>{profile.bio}</Text>
      </Section>

      {profile.interests.length > 0 ? (
        <Section title="Interests">
          <View style={styles.chipRow}>
            {profile.interests.map((interest) => (
              <Chip key={interest} label={interest} />
            ))}
          </View>
        </Section>
      ) : null}

      {profile.availableTimes.length > 0 ? (
        <Section title="Availability">
          <View style={styles.chipRow}>
            {profile.availableTimes.map((slot) => (
              <Chip key={slot} label={availabilityLabel(slot)} />
            ))}
          </View>
        </Section>
      ) : null}

      <View style={styles.actions}>
        <AppButton title="Connect" onPress={handleConnect} disabled={busy} />
        <View style={styles.gap} />
        <AppButton
          title="Report"
          onPress={handleReport}
          variant="secondary"
          disabled={busy}
        />
        <View style={styles.gap} />
        <AppButton
          title="Block"
          onPress={handleBlock}
          variant="danger"
          disabled={busy}
        />
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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
  },
  previewNote: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.title,
  },
  country: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  scoreCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  score: {
    ...typography.subtitle,
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  gap: {
    height: spacing.md,
  },
});
