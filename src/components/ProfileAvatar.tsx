import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";
import type { Profile } from "../types/domain";

interface ProfileAvatarProps {
  profile?: Pick<Profile, "displayName" | "photoURL" | "avatarUrl"> | null;
  name?: string | null;
  photoURL?: string | null;
  size?: number;
}

function initialsFromName(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "?";
}

export function ProfileAvatar({
  profile,
  name,
  photoURL,
  size = 48,
}: ProfileAvatarProps) {
  const displayName = name ?? profile?.displayName;
  const sourceUrl = photoURL ?? profile?.photoURL ?? profile?.avatarUrl;
  const borderRadius = size / 2;

  if (sourceUrl) {
    return (
      <Image
        source={{ uri: sourceUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.fallback,
        { width: size, height: size, borderRadius },
      ]}
    >
      <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.42) }]}>
        {initialsFromName(displayName)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.primarySoft,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "700",
    color: colors.primary,
  },
});
