import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";

const REQUIRED_ENV_VARS = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
];

export function SetupRequiredScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Firebase setup required</Text>
      <Text style={styles.body}>
        LangMate needs a Firebase project to sign in and store profiles,
        matches, and messages.
      </Text>
      <Text style={styles.body}>
        Copy <Text style={styles.code}>.env.example</Text> to{" "}
        <Text style={styles.code}>.env</Text> in the project root, fill in your
        Firebase web app settings, then restart the dev server.
      </Text>
      <View style={styles.varsBox}>
        {REQUIRED_ENV_VARS.map((name) => (
          <Text key={name} style={styles.varName}>
            {name}
          </Text>
        ))}
      </View>
      <Text style={styles.caption}>
        You can find these values in the Firebase console under Project
        settings → Your apps (Web app).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.lg,
  },
  body: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  code: {
    fontWeight: "700",
    color: colors.primary,
  },
  varsBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginVertical: spacing.lg,
  },
  varName: {
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.xs,
    fontFamily: undefined,
  },
  caption: {
    ...typography.caption,
  },
});
