# LangMate Observability / Error Logging Baseline

Status: Local-first baseline for Web/Firebase beta QA. This is not production
observability and does not add any external monitoring service.

## What Is Implemented

- `src/utils/errorLogging.ts`
  - `classifyError(error)`
  - `getSafeErrorMessage(error)`
  - `getDeveloperDiagnostic(error, context?, metadata?)`
  - `logAppError(context, error, metadata?)`
- Existing helpers now delegate to the baseline:
  - `src/utils/errorMessage.ts`
  - `src/utils/logging.ts`
- Development console diagnostics use a stable object shape for future
  Sentry/Crashlytics-style integration.
- User-facing messages are concise and avoid raw Firebase implementation
  details.

## Error Categories

- `permission_denied`
- `unauthenticated`
- `not_found`
- `unavailable`
- `timeout`
- `network`
- `validation`
- `unknown`

## Privacy And Safety Rules

Diagnostics must not log secrets, tokens, passwords, email verification links,
full Firebase config values, `.env` values, or Admin SDK credentials.

The local baseline redacts metadata keys matching:

- `password`
- `token`
- `secret`
- `apiKey`
- `authDomain`
- `projectId`
- `appId`
- `measurementId`
- `email`

Diagnostic strings also redact email-like values and secret-like assignments
before printing.

## Manual QA Capture Format

When a tester hits an error, capture:

| Field | Example |
| --- | --- |
| Screen | Discover |
| Action | Tap Connect |
| Safe user-facing message | You do not have permission to do that. |
| Developer diagnostic | Category, code, context, timestamp from console |
| Expected next action | Sign in again, retry, or file a bug with the diagnostic |

Do not paste `.env` values, passwords, tokens, Firebase config values, or full
personal email addresses into QA notes.

## What Is Not Implemented

- No Sentry, Datadog, LogRocket, Crashlytics, or external observability service.
- No paid service.
- No real backend logging.
- No Cloud Functions logs.
- No server-side audit trail.
- No production observability completeness claim.

## Future Path

- Add production crash/error monitoring after service/provider review.
- Add server-side audit logs for account deletion and moderation workflows.
- Use Cloud Functions logs for trusted backend processors.
- Add admin moderation audit trail tied to future Admin SDK/server workflows.
- Add QA runbooks for permission-denied, unauthenticated, offline, and timeout
  scenarios.

