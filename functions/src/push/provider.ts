export type PushPayload = {
  title: string;
  body: string;
  data: {
    matchId: string;
    senderId: string;
    messageId: string;
    notificationType: string;
    idempotencyKey: string;
  };
};

export type PushTarget = { token: string; tokenId: string };

export type PushResult = {
  target: PushTarget;
  ok: boolean;
  retryable: boolean;
  permanent: boolean;
  invalidToken: boolean;
  ticketId?: string;
  code?: string;
};

export type ReceiptResult = {
  ticketId: string;
  ok: boolean;
  retryable: boolean;
  permanent: boolean;
  invalidToken: boolean;
  code?: string;
};

export interface PushProvider {
  readonly name: string;
  sendPushBatch(targets: PushTarget[], payload: PushPayload): Promise<PushResult[]>;
  getReceipts(ticketIds: string[]): Promise<ReceiptResult[]>;
}

export function isExpoPushToken(token: string): boolean {
  return /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token);
}

export function classifyProviderCode(code: string | undefined): Pick<PushResult, "retryable" | "permanent" | "invalidToken"> {
  if (code === "DeviceNotRegistered" || code === "InvalidCredentials") {
    return { retryable: false, permanent: true, invalidToken: code === "DeviceNotRegistered" };
  }
  if (["MessageRateExceeded", "ServiceUnavailable", "InternalServerError", "Timeout"].includes(code ?? "")) {
    return { retryable: true, permanent: false, invalidToken: false };
  }
  return { retryable: false, permanent: true, invalidToken: false };
}

export function validatePayload(payload: PushPayload): boolean {
  return payload.title.length > 0 && payload.title.length <= 120
    && payload.body.length > 0 && payload.body.length <= 160
    && Object.values(payload.data).every((value) => typeof value === "string" && value.length > 0);
}

export function makeMessagePayload(input: Omit<PushPayload["data"], "idempotencyKey"> & { idempotencyKey: string }): PushPayload {
  return {
    title: "New message",
    // Deliberately never derive this from message text; lock-screen content is private.
    body: "You have a new message in LangMate.",
    data: input,
  };
}

export function retryDelayMs(retryCount: number): number {
  return Math.min(60 * 60 * 1000, 30_000 * 2 ** Math.max(0, retryCount - 1));
}

export const MAX_PUSH_RETRIES = 5;
export const MAX_RECEIPT_CHECKS = 5;
export const PROCESSING_LEASE_MS = 5 * 60 * 1000;
