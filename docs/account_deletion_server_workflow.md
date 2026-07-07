# Account Deletion Server Workflow

Current account deletion requests are stored at:

```text
accountDeletionRequests/{uid}
```

This is a commercial product backend workflow that must run in trusted
server-side code, not in the Expo client.

## Proposed Processing Steps

1. Verify the authenticated request belongs to the `uid`.
2. Mark `accountDeletionRequests/{uid}` as processing.
3. Remove the user from discoverability and recommendation surfaces.
4. Anonymize or delete profile data after retention checks.
5. Retain safety, audit, billing, and legal records where legally appropriate.
6. Mark the request completed with timestamps and processor metadata.

## Retention Risks

Account deletion must account for legal, audit, safety, fraud-prevention, and
billing retention requirements. A production processor should avoid deleting
records that the business is legally required or permitted to retain, while
also avoiding unnecessary personal data retention.

## Next Implementation Step

Add a trusted Cloud Function or Admin SDK job that claims one request at a time,
performs the reviewable processing steps, writes status transitions, and emits
structured logs without exposing secrets or personal data.
