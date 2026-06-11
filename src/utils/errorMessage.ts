const DEFAULT_FALLBACK = "Something went wrong.";

/**
 * Returns a safe, human-readable message for an unknown error value.
 * Never stringifies arbitrary objects (they may carry config or internals);
 * anything that is not an Error-with-message or a string becomes the fallback.
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback ?? DEFAULT_FALLBACK;
}
