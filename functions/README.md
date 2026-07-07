# LangMate Firebase Functions

This workspace contains trusted backend scaffolding for commercial product
workflows that should not run in the Expo client.

## Current scope

* Server-authority unread count scaffold for new chat messages
* Notification outbox record creation with no real push delivery
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

## Notification outbox

New message creation can enqueue `notificationOutbox/{autoId}` records with
`deliveryProvider: "not_configured"`. These records are a durable handoff point
for a future notification worker. They intentionally do not include full message
text, and no push provider is called from this scaffold.

## Deployment

Review environment, regions, IAM, and billing controls before deployment:

```bash
npm run deploy
```
