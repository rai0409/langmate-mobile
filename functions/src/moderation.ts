export const MODERATION_ACTION_NO_ACTION = "no_action" as const;
export const MODERATION_ACTION_WARN = "warn" as const;
export const MODERATION_ACTION_SHADOW_LIMIT = "shadow_limit" as const;
export const MODERATION_ACTION_SUSPEND = "suspend" as const;
export const MODERATION_ACTION_BAN = "ban" as const;

export type ModerationAction =
  | typeof MODERATION_ACTION_NO_ACTION
  | typeof MODERATION_ACTION_WARN
  | typeof MODERATION_ACTION_SHADOW_LIMIT
  | typeof MODERATION_ACTION_SUSPEND
  | typeof MODERATION_ACTION_BAN;

export const REPORTS_COLLECTION = "reports" as const;
export const REPORT_REVIEWS_COLLECTION = "reportReviews" as const;
export const USER_MODERATION_STATUS_COLLECTION =
  "userModerationStatus" as const;

/*
 * Future report review processing should run only in trusted server-side code.
 * A reviewer workflow can read reports/{reportId}, write
 * reportReviews/{reportId}, and update userModerationStatus/{uid} with the
 * selected action. The normal client app must not expose report listing or
 * moderation writes.
 */
