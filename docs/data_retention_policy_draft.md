# LangMate Data Retention Policy Draft

Status: Draft for product planning. Legal review is required before using this
as a public or internal production retention policy. This document does not
claim legal compliance is complete.

## 日本語サマリー

LangMate は、サービス提供、安全確保、不正利用対策、問い合わせ対応のために
データを保存する必要があります。一方で、不要になった個人データは削除
または匿名化できる設計が必要です。具体的な保存期間は法務レビュー後に
確定する必要があります。

Contact placeholder: privacy@example.invalid

## Draft Retention Approach

| Data category | Draft approach | Production review needed |
| --- | --- | --- |
| Auth account | Keep while account is active; delete via trusted backend after approved request. | Firebase Auth deletion timing and identity verification. |
| Profile | Keep while active; delete or anonymize after approved deletion request. | Effects on matches, reports, and chat history. |
| Swipes | Keep while active for match logic; delete/anonymize when no longer needed. | Abuse prevention and analytics limits. |
| Matches | Keep while needed for chat; remove membership or anonymize after deletion. | Impact on the other member's chat history. |
| Messages | Keep for user chat history; delete/anonymize under reviewed policy. | Whether both-party messages can be deleted, retained, or redacted. |
| Blocks | Keep while needed for safety filtering. | Retention after deletion for abuse prevention. |
| Reports | Keep for moderation and safety review. | Minimum/maximum retention and access controls. |
| Moderation reviews | Server/admin-only; keep for audit and safety. | Legal basis, retention length, and admin audit controls. |
| User moderation status | Server/admin-only; keep while needed for safety enforcement. | Status expiry and appeal process. |
| Account deletion requests | Keep while processing; retain completion evidence in server-only audit storage. | Retention period and notification requirements. |

## Deletion Principles

- Do not delete real data from the normal client app.
- Use a trusted backend with Admin SDK or Cloud Functions for production.
- Prefer anonymization where deleting shared records would harm another user's
  legitimate history or safety evidence.
- Preserve only what is necessary for safety, legal, dispute, or fraud reasons.
- Keep access to retained safety/admin data restricted to authorized operators.
- Record enough audit metadata to show that a request was processed, without
  exposing unnecessary personal data.

## Open Decisions

- Final retention periods by country and app-store target market.
- Whether chat messages are deleted, anonymized, or retained for the other
  participant after one user deletes their account.
- Whether reports/blocks survive account deletion and in what form.
- User notification wording and timing.
- Admin audit log storage location and access policy.
- Data export/access request process.

