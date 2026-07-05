import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Chip } from "../components/Chip";
import { MatchReasonList } from "../components/MatchReasonList";
import { ProfileAvatar } from "../components/ProfileAvatar";
import {
  availabilityLabel,
  learningGoalLabel,
  levelLabel,
} from "../constants/options";
import { useAuth } from "../context/AuthContext";
import { hasFirebaseConfig } from "../firebase/config";
import { createMatchIfMutualConnect } from "../repositories/matchRepository";
import { blockUser, reportUser } from "../repositories/safetyRepository";
import { createSwipe } from "../repositories/swipeRepository";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { ReportReason } from "../types/domain";
import type { RootStackParamList } from "../types/navigation";
import { getErrorMessage } from "../utils/errorMessage";
import { logDevError } from "../utils/logging";
import { notify } from "../utils/notify";
import {
  formatLanguageList,
  nativeLanguagesForProfile,
  targetLanguagesForProfile,
} from "../utils/profileLanguages";

type Props = NativeStackScreenProps<RootStackParamList, "UserDetail">;

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "other", label: "Other" },
];

export function UserDetailScreen({ route }: Props) {
  const { profile, scoreResult, isPreview } = route.params;
  const { currentUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

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
    if (profile.uid === currentUser.uid) {
      notify("Action unavailable", "You cannot use this action on your own profile.");
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

  const submitReport = async () => {
    if (!guardWrites()) return;
    setBusy(true);
    try {
      await reportUser(
        currentUser!.uid,
        profile.uid,
        reportReason,
        reportDetails
      );
      setReportSent(true);
      setShowReportForm(false);
      setReportDetails("");
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
      setIsBlocked(true);
      setShowBlockConfirm(false);
      notify(
        "User blocked",
        `${profile.displayName} has been blocked and will be hidden from your Discover and Matches.`
      );
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

      <View style={styles.header}>
        <ProfileAvatar profile={profile} size={84} />
        <Text style={styles.name}>{profile.displayName}</Text>
        {profile.country ? (
          <Text style={styles.country}>{profile.country}</Text>
        ) : null}
      </View>

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
          Native: {formatLanguageList(nativeLanguagesForProfile(profile))}
        </Text>
        <Text style={typography.body}>
          Learning: {formatLanguageList(targetLanguagesForProfile(profile))} (
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
        {isBlocked ? (
          <View style={styles.blockedState}>
            <Text style={styles.blockedTitle}>User blocked</Text>
            <Text style={styles.blockedText}>
              This user is blocked and will be hidden or restricted where block
              filtering is available.
            </Text>
          </View>
        ) : null}

        {reportSent ? (
          <View style={styles.reportSuccess}>
            <Text style={styles.reportSuccessText}>
              Report sent. Thank you for helping keep LangMate safe.
            </Text>
          </View>
        ) : null}

        {showReportForm ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Report this profile?</Text>
            <Text style={styles.confirmText}>
              Choose a reason before sending a report. Nothing is saved if you
              cancel.
            </Text>
            <View style={styles.reasonList}>
              {REPORT_REASONS.map((reason) => (
                <AppButton
                  key={reason.value}
                  title={reason.label}
                  onPress={() => setReportReason(reason.value)}
                  variant={
                    reportReason === reason.value ? "primary" : "secondary"
                  }
                  disabled={busy}
                />
              ))}
            </View>
            <TextInput
              style={styles.detailsInput}
              value={reportDetails}
              onChangeText={setReportDetails}
              placeholder="Optional details"
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!busy}
            />
            <View style={styles.confirmActions}>
              <AppButton
                title="Cancel"
                onPress={() => setShowReportForm(false)}
                variant="ghost"
                disabled={busy}
              />
              <View style={styles.actionGap} />
              <AppButton
                title="Send report"
                onPress={submitReport}
                variant="danger"
                disabled={busy}
              />
            </View>
          </View>
        ) : null}

        {showBlockConfirm ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Block this user?</Text>
            <Text style={styles.confirmText}>
              Blocking {profile.displayName} will hide or restrict them in
              areas that support block filtering, including chat.
            </Text>
            <View style={styles.confirmActions}>
              <AppButton
                title="Cancel"
                onPress={() => setShowBlockConfirm(false)}
                variant="ghost"
                disabled={busy}
              />
              <View style={styles.actionGap} />
              <AppButton
                title="Block user"
                onPress={handleBlock}
                variant="danger"
                disabled={busy}
              />
            </View>
          </View>
        ) : null}

        <AppButton
          title="Connect"
          onPress={handleConnect}
          disabled={busy || isBlocked}
        />
        <View style={styles.gap} />
        <AppButton
          title="Report"
          onPress={() => setShowReportForm(true)}
          variant="secondary"
          disabled={busy || reportSent}
        />
        <View style={styles.gap} />
        <AppButton
          title="Block"
          onPress={() => setShowBlockConfirm(true)}
          variant="danger"
          disabled={busy || isBlocked}
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
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.title,
    marginTop: spacing.md,
  },
  country: {
    ...typography.caption,
    marginTop: 2,
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
  blockedState: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  blockedTitle: {
    ...typography.subtitle,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  blockedText: {
    ...typography.body,
    color: colors.danger,
  },
  reportSuccess: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reportSuccessText: {
    ...typography.body,
  },
  confirmCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  confirmTitle: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  confirmText: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  reasonList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailsInput: {
    ...typography.body,
    minHeight: 88,
    textAlignVertical: "top",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionGap: {
    width: spacing.sm,
  },
  gap: {
    height: spacing.md,
  },
});
