import { Alert, Platform } from "react-native";
import { getErrorMessage } from "./errorMessage";

/** Cross-platform alert: Alert.alert is a no-op on react-native-web. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/** Kept for existing callers; delegates to the shared safe error formatter. */
export function errorMessage(error: unknown): string {
  return getErrorMessage(error);
}
