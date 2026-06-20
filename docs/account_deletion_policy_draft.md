# LangMate Account Deletion Policy Draft

Status: Draft for product planning. Legal review is required before using this
as a public account deletion policy. This does not claim GDPR, APPI, App Store,
or Play Store compliance is complete.

## 日本語サマリー

ユーザーはアカウント削除をリクエストできる必要があります。現時点の
LangMate では、`accountDeletionRequests/{uid}` に削除リクエストを保存する
ための安全なベースラインだけを追加しています。実データ削除はまだ
実装していません。

本番対応には、本人確認、削除対象データの特定、保存が必要な安全・法務
レコードの扱い、削除または匿名化、完了通知、監査ログが必要です。

Contact placeholder: privacy@example.invalid

## Current Baseline

- Users may create or update only their own request document:
  `accountDeletionRequests/{uid}`.
- Users may read only their own request document.
- Normal clients cannot list all deletion requests.
- Normal clients cannot read another user's deletion request.
- Normal clients cannot delete Firebase data.
- No Admin SDK credentials are required or used by this baseline.

## Request Fields

The current request model allows:

- `uid`: must match the authenticated user and document id.
- `status`: client-fixed to `requested`.
- `reason`: optional user-provided reason.
- `contactEmail`: optional contact email.
- `requestedAt` and `updatedAt`: timestamps.
- `source`: optional request source such as `web`.

## Future Production Processor

Actual deletion should run from a trusted backend, such as Firebase Cloud
Functions or an Admin SDK script, not from the Expo client. The processor should:

- Verify the requester identity.
- Load the deletion request and current user state.
- Delete or anonymize eligible profile, swipe, match, message, and account data.
- Preserve or redact safety records according to the reviewed retention policy.
- Avoid deleting another user's messages or safety evidence without a reviewed
  policy decision.
- Delete the Firebase Authentication account when appropriate.
- Record completion metadata in a server-only audit location.
- Notify the user through an approved contact path when the request is complete
  or delayed.

## Not Implemented Yet

- No real Firebase data deletion.
- No Firebase Auth user deletion.
- No Admin SDK or Cloud Function processor.
- No final retention schedule.
- No legally reviewed user notification workflow.
- No compliance claim.

