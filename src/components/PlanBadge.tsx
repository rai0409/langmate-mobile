import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/theme";
import type { Plan } from "../types/domain";

interface PlanBadgeProps {
  plan: Plan;
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const isPremium = plan === "premium";

  return (
    <View style={[styles.badge, isPremium ? styles.premium : styles.free]}>
      <Text style={[styles.text, isPremium ? styles.premiumText : styles.freeText]}>
        {isPremium ? "Premium" : "Free"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  free: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
  },
  premium: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
  freeText: {
    color: colors.primary,
  },
  premiumText: {
    color: colors.accent,
  },
});
