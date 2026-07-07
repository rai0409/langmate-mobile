# Notification Outbox Design

LangMate uses a notification outbox as a commercial product backend handoff
between user activity and future delivery workers.

## Collection

```text
notificationOutbox/{autoId}
```

## Fields

* `type`
* `matchId`
* `messageId`
* `senderUid`
* `recipientUid`
* `status`
* `deliveryProvider`
* `createdAt`
* `processedAt` optional
* `error` optional

## Lifecycle

* `pending`: record is queued for a future worker.
* `skipped`: worker intentionally skipped delivery.
* `sent`: worker sent the notification through a configured provider.
* `failed`: worker attempted delivery and recorded a failure.

## Privacy

Do not store full message text by default. The outbox should contain routing
metadata only unless a later product and privacy review approves additional
payload fields.

Real push delivery is not implemented yet.
