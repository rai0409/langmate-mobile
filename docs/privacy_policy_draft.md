# LangMate Privacy Policy Draft

Status: Draft for product planning. Legal review is required before using this
as a public privacy policy. This document does not claim GDPR, APPI, App Store,
or Play Store compliance is complete.

## 日本語サマリー

LangMate は、言語交換パートナーを見つけてチャットするために必要な
アカウント情報、プロフィール情報、スワイプ、マッチ、メッセージ、
ブロック、通報、モデレーション関連情報、アカウント削除リクエストを
扱います。現在のバックエンドは Firebase Authentication と Cloud
Firestore を利用します。

この文書はドラフトです。実際に公開する前に、対象国、提供会社、
問い合わせ窓口、保存期間、削除手順、未成年者対応、法令上の根拠、
第三者提供、越境移転、ストア要件を専門家が確認する必要があります。

Contact placeholder: privacy@example.invalid

## Data We Collect

- Auth account data: email/password authentication records handled by Firebase
  Authentication.
- Profile data: display name, native language, target language, level,
  learning goal, interests, availability, country, bio, discoverability flag,
  and optional avatar URL.
- Discovery and matching data: swipe actions, matches, and match summaries.
- Chat data: 1:1 message text, sender uid, timestamps, and match metadata.
- Safety data: block records and user reports.
- Moderation data: future admin-only report reviews, moderation review events,
  and user moderation status.
- Account deletion request data: request status, request reason if provided,
  optional contact email, source, and timestamps.
- Technical data: Firebase-generated identifiers and timestamps needed to run
  the service. Production observability is not implemented yet.

## Why We Use Data

- Create and secure user accounts.
- Show profiles and recommendations to compatible language partners.
- Enable mutual matching and 1:1 chat.
- Provide safety features such as blocking and reporting.
- Support future moderation review and account deletion operations.
- Maintain service integrity, troubleshoot issues, and prepare operational
  workflows.

## Firebase Backend

LangMate uses Firebase Authentication and Cloud Firestore. Firestore security
rules limit normal client access by collection and user identity. Admin SDK,
Cloud Functions, or a server-side admin workflow are required for production
moderation and actual account deletion. No Admin SDK credentials are stored in
the Expo client app.

## Visibility

- A discoverable profile may be visible to signed-in users.
- A non-discoverable profile is intended to be visible only to its owner except
  where existing matches may need limited partner context in future designs.
- Messages are intended to be visible only to match members.
- Reports are write-only from normal clients.
- Blocks are visible to both sides so the app can filter interactions.
- Moderation collections are currently denied to normal clients.
- Account deletion requests are readable only by the requesting user from the
  client side; production processing must be server-side.

## Account Deletion

Users should be able to request deletion of their account and related personal
data. The current baseline stores a non-destructive request record at
`accountDeletionRequests/{uid}`. It does not delete real Firebase data.

Actual deletion requires a future server/admin workflow that verifies identity,
applies retention rules for safety/legal records, removes or anonymizes eligible
data, and records completion evidence outside the normal client app.

## Limitations

- This draft is not legal advice.
- Actual production deletion is not implemented.
- Production moderation tooling is not implemented.
- Final data retention periods are not legally reviewed.
- Compliance with GDPR, APPI, App Store, Play Store, or other requirements is
  not claimed.

