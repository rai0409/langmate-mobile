import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { hasFirebaseConfig } from "../firebase/config";
import { getConfiguredDb } from "./firestoreHelpers";

const INSTALLATION_ID_KEY = "langmate.push.installation-id.v1";

async function installationId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existing) return existing;
  const next = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, next);
  return next;
}

function expoProjectId(): string | undefined {
  return Constants.easConfig?.projectId
    ?? (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId;
}

/** Best-effort registration: never blocks authentication or app startup. */
export async function registerExpoPushToken(uid: string): Promise<void> {
  if (Platform.OS === "web" || !hasFirebaseConfig() || !Device.isDevice) return;
  try {
    const existing = await Notifications.getPermissionsAsync();
    const permission = existing.status === "granted"
      ? existing
      : await Notifications.requestPermissionsAsync();
    if (permission.status !== "granted") return;
    const projectId = expoProjectId();
    if (!projectId) return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (!token) return;
    const deviceId = await installationId();
    await setDoc(doc(getConfiguredDb(), "users", uid, "pushTokens", deviceId), {
      uid,
      token,
      platform: Platform.OS,
      deviceId,
      enabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      invalidatedAt: null,
      invalidReason: null,
    }, { merge: true });
  } catch {
    // Unsupported native builds, permission services, and token transport are non-fatal.
  }
}

export async function invalidateCurrentExpoPushToken(uid: string): Promise<void> {
  if (Platform.OS === "web" || !hasFirebaseConfig()) return;
  try {
    const deviceId = await installationId();
    await updateDoc(doc(getConfiguredDb(), "users", uid, "pushTokens", deviceId), {
      enabled: false,
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      invalidatedAt: serverTimestamp(),
      invalidReason: "signed_out",
    });
  } catch {
    // Sign-out must still succeed if a stale token record cannot be updated.
  }
}
