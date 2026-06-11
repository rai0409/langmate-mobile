import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme/theme";

interface MatchReasonListProps {
  reasons: string[];
  missingFields: string[];
}

export function MatchReasonList({
  reasons,
  missingFields,
}: MatchReasonListProps) {
  return (
    <View>
      {reasons.map((reason) => (
        <View key={reason} style={styles.row}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.reason}>{reason}</Text>
        </View>
      ))}
      {missingFields.length > 0 ? (
        <Text style={styles.note}>
          More profile details are needed for a stronger match score.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  bullet: {
    ...typography.body,
    color: colors.accent,
    marginRight: spacing.sm,
  },
  reason: {
    ...typography.body,
    flex: 1,
  },
  note: {
    ...typography.caption,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
});
