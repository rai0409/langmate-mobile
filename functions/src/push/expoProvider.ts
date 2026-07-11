import {
  classifyProviderCode,
  type PushPayload,
  type PushProvider,
  type PushResult,
  type PushTarget,
  type ReceiptResult,
} from "./provider";

type ExpoTicket = { status?: string; id?: string; details?: { error?: string } };
type ExpoReceipt = { status?: string; details?: { error?: string } };

export class ExpoPushProvider implements PushProvider {
  readonly name = "expo";

  constructor(private readonly accessToken: string) {}

  async sendPushBatch(targets: PushTarget[], payload: PushPayload): Promise<PushResult[]> {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.accessToken}` },
      body: JSON.stringify(targets.map((target) => ({ to: target.token, title: payload.title, body: payload.body, data: payload.data }))),
    });
    if (!response.ok) throw new Error(`Expo HTTP ${response.status}`);
    const body = await response.json() as { data?: ExpoTicket[] };
    return targets.map((target, index) => normalizeTicket(target, body.data?.[index]));
  }

  async getReceipts(ticketIds: string[]): Promise<ReceiptResult[]> {
    if (ticketIds.length === 0) return [];
    const response = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.accessToken}` },
      body: JSON.stringify({ ids: ticketIds }),
    });
    if (!response.ok) throw new Error(`Expo receipts HTTP ${response.status}`);
    const body = await response.json() as { data?: Record<string, ExpoReceipt> };
    return ticketIds.map((ticketId) => normalizeReceipt(ticketId, body.data?.[ticketId]));
  }
}

export function normalizeTicket(target: PushTarget, ticket: ExpoTicket | undefined): PushResult {
  const code = ticket?.details?.error;
  if (ticket?.status === "ok" && ticket.id) return { target, ok: true, retryable: false, permanent: false, invalidToken: false, ticketId: ticket.id };
  return { target, ok: false, code, ...classifyProviderCode(code) };
}

export function normalizeReceipt(ticketId: string, receipt: ExpoReceipt | undefined): ReceiptResult {
  const code = receipt?.details?.error;
  if (receipt?.status === "ok") return { ticketId, ok: true, retryable: false, permanent: false, invalidToken: false };
  return { ticketId, ok: false, code, ...classifyProviderCode(code) };
}
