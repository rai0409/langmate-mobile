import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Chip } from "../components/Chip";
import {
  availabilityLabel,
  languageLabel,
  learningGoalLabel,
  levelLabel,
} from "../constants/options";
import { useAuth } from "../context/AuthContext";
import { useCurrentProfile } from "../context/ProfileContext";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { RootStackParamList } from "../types/navigation";
import { logAppError } from "../utils/errorLogging";
import { errorMessage, notify } from "../utils/notify";

export function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut, currentUser } = useAuth();
  const { profile } = useCurrentProfile();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      logAppError("profile_sign_out_failed", e);
      notify("Could not sign out", errorMessage(e));
      setSigningOut(false);
    }
  };

  const signedInEmail = currentUser?.email?.trim();
  const signedInLabel = signedInEmail || "Email unavailable";
  const signedInUid = currentUser?.uid ?? "Unknown user";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.displayName ?? "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.displayName ?? "Your profile"}</Text>
        {profile?.country ? (
          <Text style={styles.caption}>{profile.country}</Text>
        ) : null}
      </View>

      <View style={styles.sessionCard}>
        <Text style={styles.sessionTitle}>Signed in as</Text>
        <Text style={styles.sessionEmail}>{signedInLabel}</Text>
        <Text style={styles.uidLabel}>UID</Text>
        <Text style={styles.uidValue}>{signedInUid}</Text>
      </View>

      {profile ? (
        <View style={styles.card}>
          <Row label="Native language" value={languageLabel(profile.nativeLang)} />
          <Row label="Learning" value={languageLabel(profile.targetLang)} />
          <Row label="Level" value={levelLabel(profile.level)} />
          <Row label="Goal" value={learningGoalLabel(profile.learningGoal)} />
          <Row
            label="Discoverable"
            value={profile.isDiscoverable ? "Yes" : "No"}
          />
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={typography.body}>{profile.bio}</Text>
          {profile.interests.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.chipRow}>
                {profile.interests.map((interest) => (
                  <Chip key={interest} label={interest} />
                ))}
              </View>
            </>
          ) : null}
          {profile.availableTimes.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Availability</Text>
              <View style={styles.chipRow}>
                {profile.availableTimes.map((slot) => (
                  <Chip key={slot} label={availabilityLabel(slot)} />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : (
        <Text style={styles.caption}>No profile saved yet.</Text>
      )}

      <View style={styles.actions}>
        <AppButton
          title="Edit Profile"
          onPress={() => navigation.navigate("EditProfile")}
          variant="secondary"
          disabled={signingOut}
        />
        <View style={styles.gap} />
        <AppButton
          title={signingOut ? "Signing out..." : "Logout"}
          onPress={handleSignOut}
          variant="danger"
          disabled={signingOut}
        />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.primary,
  },
  name: {
    ...typography.title,
  },
  caption: {
    ...typography.caption,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sessionTitle: {
    ...typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  sessionEmail: {
    ...typography.body,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  uidLabel: {
    ...typography.caption,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  uidValue: {
    ...typography.caption,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  rowLabel: {
    ...typography.caption,
  },
  rowValue: {
    ...typography.body,
    fontWeight: "600",
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actions: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  gap: {
    height: spacing.md,
  },
});
