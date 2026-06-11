import { Alert, Platform } from "react-native";

/** Cross-platform alert: Alert.alert is a no-op on react-native-web. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
