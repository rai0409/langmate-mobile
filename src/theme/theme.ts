export const colors = {
  background: "#F7FAF9",
  surface: "#FFFFFF",
  text: "#1E2A2B",
  textMuted: "#5C6B6D",
  primary: "#2E7D8C",
  primarySoft: "#E1F0F3",
  accent: "#4CAF8D",
  accentSoft: "#E4F4EC",
  border: "#D9E2E1",
  danger: "#C24A4A",
  dangerSoft: "#F8E7E7",
  chipBg: "#EEF4F3",
  overlay: "rgba(30, 42, 43, 0.4)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
};

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    color: colors.text,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: colors.textMuted,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
};
