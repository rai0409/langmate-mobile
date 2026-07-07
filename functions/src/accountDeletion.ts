export const ACCOUNT_DELETION_REQUESTS_COLLECTION =
  "accountDeletionRequests" as const;

export const ACCOUNT_DELETION_STATUS_REQUESTED = "requested" as const;
export const ACCOUNT_DELETION_STATUS_PROCESSING = "processing" as const;
export const ACCOUNT_DELETION_STATUS_COMPLETED = "completed" as const;

export type AccountDeletionStatus =
  | typeof ACCOUNT_DELETION_STATUS_REQUESTED
  | typeof ACCOUNT_DELETION_STATUS_PROCESSING
  | typeof ACCOUNT_DELETION_STATUS_COMPLETED;

export function accountDeletionRequestPath(uid: string): string {
  return `${ACCOUNT_DELETION_REQUESTS_COLLECTION}/${uid}`;
}

/*
 * Placeholder for a future trusted account deletion processor.
 *
 * Intended server-side sequence:
 * 1. Verify the authenticated request belongs to the uid being processed.
 * 2. Mark accountDeletionRequests/{uid} as processing.
 * 3. Remove the profile from discovery and match recommendations.
 * 4. Anonymize or delete profile data after retention checks.
 * 5. Retain safety, audit, billing, and legal records where appropriate.
 * 6. Mark the request completed after all required processors finish.
 *
 * This module intentionally performs no destructive deletion.
 */
