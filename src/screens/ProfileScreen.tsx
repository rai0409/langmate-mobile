import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Chip } from "../components/Chip";
import { PlanBadge } from "../components/PlanBadge";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { ProfileCompletenessCard } from "../components/ProfileCompletenessCard";
import { UpgradeHintCard } from "../components/UpgradeHintCard";
import {
  availabilityLabel,
  learningGoalLabel,
  levelLabel,
} from "../constants/options";
import { useAuth } from "../context/AuthContext";
import { useCurrentProfile } from "../context/ProfileContext";
import { getUserPlan } from "../repositories/entitlementRepository";
import { uploadProfilePhoto } from "../repositories/storageRepository";
import { colors, radius, spacing, typography } from "../theme/theme";
import type { Plan } from "../types/domain";
import type { RootStackParamList } from "../types/navigation";
import { logAppError } from "../utils/errorLogging";
import { errorMessage, notify } from "../utils/notify";
import {
  formatLanguageList,
  nativeLanguagesForProfile,
  targetLanguagesForProfile,
} from "../utils/profileLanguages";

export function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut, currentUser } = useAuth();
  const { profile } = useCurrentProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");

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

  const handlePickPhoto = async () => {
    if (!currentUser) {
      notify("Not signed in", "Please sign in again.");
      return;
    }
    if (uploadingPhoto) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        notify(
          "Photo access denied",
          "Allow photo library access to choose a profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) {
        notify("Could not choose photo", "Please choose a different image.");
        return;
      }

      setUploadingPhoto(true);
      await uploadProfilePhoto(currentUser.uid, asset.uri);
      notify("Profile photo updated", "Your new photo has been saved.");
    } catch (e) {
      logAppError("profile_photo_upload_failed", e);
      notify("Could not update photo", errorMessage(e));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const signedInEmail = currentUser?.email?.trim();
  const signedInLabel = signedInEmail || "Email unavailable";
  const signedInUid = currentUser?.uid ?? "Unknown user";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ProfileAvatar
          profile={profile}
          name={profile?.displayName ?? "Your profile"}
          size={96}
        />
        <Text style={styles.name}>{profile?.displayName ?? "Your profile"}</Text>
        {profile?.country ? (
          <Text style={styles.caption}>{profile.country}</Text>
        ) : null}
        <View style={styles.badgeWrap}>
          <PlanBadge plan={plan} />
        </View>
        <View style={styles.photoAction}>
          <AppButton
            title={uploadingPhoto ? "Uploading..." : "Change Photo"}
            onPress={handlePickPhoto}
            variant="secondary"
            disabled={signingOut || uploadingPhoto}
          />
        </View>
      </View>

      <View style={styles.stackGap}>
        <ProfileCompletenessCard profile={profile} />
      </View>

      {profile ? (
        <View style={[styles.card, styles.stackGap]}>
          <Row
            label="Native language"
            value={formatLanguageList(nativeLanguagesForProfile(profile))}
          />
          <Row
            label="Learning"
            value={formatLanguageList(targetLanguagesForProfile(profile))}
          />
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

      {plan === "free" ? (
        <View style={styles.stackGap}>
          <UpgradeHintCard
            onPreview={() =>
              notify(
                "Premium coming soon",
                "Payments are not enabled in this preview build yet."
              )
            }
          />
        </View>
      ) : null}

      <View style={styles.sessionCard}>
        <Text style={styles.sessionTitle}>QA / debug account</Text>
        <Text style={styles.sessionEmail}>{signedInLabel}</Text>
        <Text style={styles.uidLabel}>UID</Text>
        <Text style={styles.uidValue}>{signedInUid}</Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Edit Profile"
          onPress={() => navigation.navigate("EditProfile")}
          variant="secondary"
          disabled={signingOut}
        />
        <View style={styles.gap} />
        <AppButton title="Delete Account" onPress={() => navigation.navigate("AccountDeletion")} variant="danger" disabled={signingOut} />
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
  name: {
    ...typography.title,
    marginTop: spacing.md,
  },
  caption: {
    ...typography.caption,
    marginTop: 2,
  },
  badgeWrap: {
    marginTop: spacing.sm,
  },
  photoAction: {
    marginTop: spacing.md,
    minWidth: 160,
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
    marginTop: spacing.lg,
    opacity: 0.82,
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
  stackGap: {
    marginBottom: spacing.lg,
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
