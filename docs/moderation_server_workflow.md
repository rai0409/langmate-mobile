# Moderation Server Workflow

Current user reports are stored at:

```text
reports/{autoId}
```

Normal users cannot list reports. Review and enforcement must happen through a
trusted server-side path.

## Proposed Review Paths

```text
reportReviews/{reportId}
userModerationStatus/{uid}
```

## Moderation Actions

* `no_action`
* `warn`
* `shadow_limit`
* `suspend`
* `ban`

## Review Workflow

A future review worker or internal tool should load a report, review profile
and safety context, write `reportReviews/{reportId}`, and update
`userModerationStatus/{uid}` when enforcement is required.

An admin review tool is required before wider launch. This task does not
implement an admin moderation dashboard.
