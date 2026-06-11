import { getErrorMessage } from "./errorMessage";

/**
 * Development-only error logging. Logs only the context label and the safe
 * message from getErrorMessage — never whole unknown objects and never
 * env/config values. No-op in production builds.
 */
export function logDevError(context: string, error: unknown): void {
  if (__DEV__) {
    console.warn(`[${context}] ${getErrorMessage(error)}`);
  }
}
