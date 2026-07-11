import type { PushPayload, PushProvider, PushResult, PushTarget, ReceiptResult } from "./provider";

/** Emulator/test-only provider. It never emits token contents. */
export class FakePushProvider implements PushProvider {
  readonly name = "fake";
  constructor(private readonly mode = process.env.FAKE_PUSH_MODE ?? "success") {}
  async sendPushBatch(targets: PushTarget[], _payload: PushPayload): Promise<PushResult[]> {
    return targets.map((target) => {
      if (this.mode === "retryable") return { target, ok: false, retryable: true, permanent: false, invalidToken: false, code: "ServiceUnavailable" };
      if (this.mode === "invalid") return { target, ok: false, retryable: false, permanent: true, invalidToken: true, code: "DeviceNotRegistered" };
      return { target, ok: true, retryable: false, permanent: false, invalidToken: false, ticketId: `fake-ticket-${target.tokenId}` };
    });
  }
  async getReceipts(ticketIds: string[]): Promise<ReceiptResult[]> {
    return ticketIds.map((ticketId) => this.mode === "receipt-invalid"
      ? { ticketId, ok: false, retryable: false, permanent: true, invalidToken: true, code: "DeviceNotRegistered" }
      : { ticketId, ok: true, retryable: false, permanent: false, invalidToken: false });
  }
}
