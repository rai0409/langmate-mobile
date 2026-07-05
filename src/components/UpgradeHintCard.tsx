import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "./AppButton";
import { colors, radius, spacing, typography } from "../theme/theme";

interface UpgradeHintCardProps {
  onPreview?: () => void;
}

export function UpgradeHintCard({ onPreview }: UpgradeHintCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Premium preview</Text>
      <Text style={styles.body}>
        Premium preview is designed for more language choices, expanded learning
        tools, and stronger profile visibility.
      </Text>
      <Text style={styles.note}>Payments are not enabled in this preview build yet.</Text>
      <View style={styles.action}>
        <AppButton
          title="Preview Premium"
          onPress={onPreview ?? (() => undefined)}
          variant="secondary"
        />
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
  title: {
    ...typography.subtitle,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  note: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.md,
  },
});
