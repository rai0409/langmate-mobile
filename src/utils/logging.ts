import { logAppError } from "./errorLogging";

/**
 * Development-only error logging. Emits a sanitized diagnostic object with a
 * stable shape for future observability integrations. No-op in production.
 */
export function logDevError(context: string, error: unknown): void {
  logAppError(context, error);
}
