import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton } from "../components/AppButton";
import { AppTextInput } from "../components/AppTextInput";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography } from "../theme/theme";
import { logAppError } from "../utils/errorLogging";
import { errorMessage } from "../utils/notify";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }
    if (!password) {
      setError("Please enter your password.");
      return false;
    }
    return true;
  };

  // On success, onAuthStateChanged moves the app forward; on failure we show
  // the error and never a success state.
  const handle = async (action: "login" | "signup") => {
    setError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      if (action === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (e) {
      logAppError("auth_screen_submit_failed", e, { action });
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>LangMate</Text>
        <Text style={styles.tagline}>
          Find a partner. Teach your language. Learn theirs.
        </Text>

        <AppTextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppTextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.buttons}>
          <AppButton
            title={busy ? "Please wait..." : "Login"}
            onPress={() => handle("login")}
            disabled={busy}
          />
          <View style={styles.buttonGap} />
          <AppButton
            title={busy ? "Please wait..." : "Signup"}
            onPress={() => handle("signup")}
            variant="secondary"
            disabled={busy}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  tagline: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  error: {
    ...typography.body,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  buttons: {
    marginTop: spacing.sm,
  },
  buttonGap: {
    height: spacing.md,
  },
});
