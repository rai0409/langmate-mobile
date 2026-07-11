# LangMate Firebase Functions

This workspace contains trusted backend scaffolding for commercial product
workflows that should not run in the Expo client.

## Current scope

* Server-authority unread count scaffold for new chat messages
* Expo Push provider abstraction, outbox delivery, retry, and receipt checks
* Account deletion workflow placeholders with no destructive deletion
* Moderation workflow constants and notes with no admin dashboard

## Setup

```bash
cd functions
npm install
npm run build
```

The workspace uses Firebase Admin SDK application default credentials at
runtime. Do not commit service accounts, push provider credentials, API keys, or
project-specific secrets.

## Notification outbox and Expo Push

New message creation enqueues a deterministic `notificationOutbox/{idempotencyKey}`
record. `deliverNotificationOutbox` claims it transactionally with a five-minute
lease, preventing duplicate sends during concurrent invocations. Retryable
provider failures use exponential backoff and stop after five attempts;
permanent failures are terminal. The scheduled worker retries due records and
checks Expo tickets for delivery receipts. Message bodies are never copied to
the outbox or notification body.

Set `EXPO_ACCESS_TOKEN` through the reviewed Functions secret/environment
configuration before production deployment. With no token, production fails
closed and records `provider_not_configured`. `PUSH_PROVIDER=fake` is allowed
only in emulator/test environments and is used by `npm run test:functions:push`.
No external Expo API calls are made by CI.

## Deployment

Review environment, regions, IAM, and billing controls before deployment:

```bash
npm run deploy
```
