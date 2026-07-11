import { ExpoPushProvider } from "./expoProvider";
import { FakePushProvider } from "./fakeProvider";
import type { PushProvider } from "./provider";

export function getPushProvider(): PushProvider | null {
  const emulator = process.env.FUNCTIONS_EMULATOR === "true" || process.env.NODE_ENV === "test";
  if (process.env.PUSH_PROVIDER === "fake" && emulator) return new FakePushProvider();
  const token = process.env.EXPO_ACCESS_TOKEN;
  if (!token) return null; // production fail-closed; caller records a terminal configuration failure.
  return new ExpoPushProvider(token);
}
