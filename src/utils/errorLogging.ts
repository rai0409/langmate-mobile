export type AppErrorCategory =
  | "invalid_credentials"
  | "email_in_use"
  | "weak_password"
  | "permission_denied"
  | "unauthenticated"
  | "not_found"
  | "unavailable"
  | "timeout"
  | "network"
  | "validation"
  | "unknown";

export interface AppErrorDiagnostic {
  category: AppErrorCategory;
  context?: string;
  code?: string;
  name?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

const REDACTED = "[redacted]";
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /apiKey/i,
  /authDomain/i,
  /projectId/i,
  /appId/i,
  /measurementId/i,
  /email/i,
];
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SENSITIVE_ASSIGNMENT_PATTERN =
  /(password|token|secret|apiKey|authDomain|projectId|appId|measurementId)\s*[:=]\s*[^,\s}]+/gi;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringField(error: unknown, field: string): string | undefined {
  if (!isRecord(error)) return undefined;
  const value = error[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getErrorCode(error: unknown): string | undefined {
  return getStringField(error, "code");
}

function getErrorName(error: unknown): string | undefined {
  if (error instanceof Error && error.name) return error.name;
  return getStringField(error, "name");
}

function getRawErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error.trim();
  return getStringField(error, "message");
}

function normalizedErrorText(error: unknown): string {
  return [getErrorCode(error), getErrorName(error), getRawErrorMessage(error)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function classifyError(error: unknown): AppErrorCategory {
  const code = (getErrorCode(error) ?? "").toLowerCase();
  const text = normalizedErrorText(error);

  if (
    code.includes("auth/invalid-credential") ||
    code.includes("auth/wrong-password") ||
    code.includes("auth/user-not-found") ||
    code.includes("auth/invalid-email") ||
    text.includes("invalid credential")
  ) {
    return "invalid_credentials";
  }
  if (code.includes("auth/email-already-in-use")) {
    return "email_in_use";
  }
  if (code.includes("auth/weak-password")) {
    return "weak_password";
  }
  if (
    code.includes("permission-denied") ||
    code.includes("permission_denied") ||
    text.includes("permission_denied") ||
    text.includes("permission-denied")
  ) {
    return "permission_denied";
  }
  if (
    code.includes("unauthenticated") ||
    code.includes("auth/user-token-expired") ||
    code.includes("auth/invalid-user-token") ||
    text.includes("unauthenticated") ||
    text.includes("not signed in")
  ) {
    return "unauthenticated";
  }
  if (code.includes("not-found") || text.includes("not-found")) {
    return "not_found";
  }
  if (code.includes("unavailable") || text.includes("unavailable")) {
    return "unavailable";
  }
  if (
    code.includes("deadline-exceeded") ||
    code.includes("timeout") ||
    text.includes("deadline-exceeded") ||
    text.includes("timed out")
  ) {
    return "timeout";
  }
  if (
    text.includes("network-request-failed") ||
    text.includes("network request failed") ||
    text.includes("failed to fetch")
  ) {
    return "network";
  }
  if (
    code.includes("invalid-argument") ||
    text.includes("validation") ||
    text.includes("required") ||
    text.includes("must be") ||
    text.includes("empty")
  ) {
    return "validation";
  }
  return "unknown";
}

export function getSafeErrorMessage(error: unknown): string {
  switch (classifyError(error)) {
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "email_in_use":
      return "An account already exists for that email.";
    case "weak_password":
      return "Please use a stronger password.";
    case "permission_denied":
      return "You do not have permission to do that.";
    case "unauthenticated":
      return "Please sign in again.";
    case "not_found":
      return "That item could not be found.";
    case "unavailable":
      return "Service is temporarily unavailable. Please try again.";
    case "timeout":
      return "The request timed out. Please try again.";
    case "network":
      return "Network connection failed. Please check your connection.";
    case "validation":
      return getRawErrorMessage(error) ?? "Please check the entered information.";
    case "unknown":
      return "Something went wrong. Please try again.";
  }
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizeString(value: string): string {
  const redacted = value
    .replace(EMAIL_PATTERN, REDACTED)
    .replace(SENSITIVE_ASSIGNMENT_PATTERN, (_match, key) => `${key}: ${REDACTED}`);
  return redacted.length > 160 ? `${redacted.slice(0, 157)}...` : redacted;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 3) return "[truncated]";
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  }
  if (isRecord(value)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, fieldValue] of Object.entries(value).slice(0, 20)) {
      sanitized[key] = isSensitiveKey(key)
        ? REDACTED
        : sanitizeValue(fieldValue, depth + 1);
    }
    return sanitized;
  }
  return String(value);
}

function sanitizeMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  return sanitizeValue(metadata, 0) as Record<string, unknown>;
}

function getSafeDiagnosticMessage(error: unknown): string | undefined {
  const message = getRawErrorMessage(error);
  if (!message) return undefined;
  return sanitizeString(message);
}

export function getDeveloperDiagnostic(
  error: unknown,
  context?: string,
  metadata?: Record<string, unknown>
): AppErrorDiagnostic {
  return {
    category: classifyError(error),
    context,
    code: getErrorCode(error),
    name: getErrorName(error),
    message: getSafeDiagnosticMessage(error),
    metadata: sanitizeMetadata(metadata),
    timestamp: new Date().toISOString(),
  };
}

export function logAppError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): AppErrorDiagnostic {
  const diagnostic = getDeveloperDiagnostic(error, context, metadata);
  if (__DEV__) {
    console.warn("[LangMate:error]", diagnostic);
  }
  return diagnostic;
}
