import { getSafeErrorMessage } from "./errorLogging";

/**
 * Returns a safe, human-readable message for an unknown error value.
 * Never stringifies arbitrary objects (they may carry config or internals);
 * anything that is not an Error-with-message or a string becomes the fallback.
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const message = getSafeErrorMessage(error);
  return message || fallback || "Something went wrong.";
}
