import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";

interface LearningSupportBarProps {
  onTranslate: () => void;
  onCorrect: () => void;
  onSuggestReply: () => void;
}

export function LearningSupportBar({
  onTranslate,
  onCorrect,
  onSuggestReply,
}: LearningSupportBarProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Learning tools preview - real AI is not connected yet</Text>
      <View style={styles.bar}>
        <SupportButton title="Translate" onPress={onTranslate} />
        <SupportButton title="Correct" onPress={onCorrect} />
        <SupportButton title="Suggest Reply" onPress={onSuggestReply} />
      </View>
    </View>
  );
}

function SupportButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  bar: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
});
