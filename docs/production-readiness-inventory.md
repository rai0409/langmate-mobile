# LangMate Mobile Production Readiness Inventory

Repository-only assessment date: 2026-07-26. This inventory deliberately does
not treat a source file, local test, or draft document as proof of a production
deployment, store approval, or operating process.

## 1. Executive status

- NOT VERIFIED: Commercial production readiness. Decision: **not ready**.
  - Evidence: the blockers in section 11 have no repository evidence of
    completion. The repository does contain a substantial mobile/Firebase
    implementation and local quality gates.
- PARTIALLY VERIFIED: Evidence-based commercial readiness score: **53/100**.
  - Purpose achievement: 30/40; constraint compliance: 9/20; verification
    quality: 8/15; security/operations: 3/15; documentation/maintainability:
    3/10.
  - Deployment ready: no. Commercial-product ready: no. Adoption decision:
    do not adopt for commercial production until P0 and P1 conditions in
    section 11 are closed. This is not a source-code merge decision.
- VERIFIED: Repository owner, copyright holder, and intended commercial
  operator are the same person, as confirmed for this inventory.
  - Release effect: the current owner’s commercial use is not a LICENSE release
    blocker, and no third-party authorization is required.
  - P2 follow-up: document intellectual-property ownership or licensing before
    incorporation, joint operation, transfer, or external contracting. Verify
    contributor and contractor rights separately if their code is introduced.
- NOT VERIFIED: Production deployment readiness, store submission readiness,
  and live-service operations.
  - Evidence: no `eas.json`, native projects, Firebase project configuration,
    deploy record, store metadata, alerting configuration, or release runbook
    is present.

## 2. Verified repository baseline

- VERIFIED: Repository baseline was checked before this assessment.
  - Commands: `git branch --show-current`; `git status --short`; `git rev-parse HEAD`; `git rev-parse origin/main`.
  - Result: branch `main`; clean working tree; HEAD and `origin/main` are both
    `6d1f6e6634ac373e4e76774924d00cac92be0ed8`.
- VERIFIED: Root application is Expo SDK 56 / React Native 0.85 / React 19 /
  TypeScript 6, with a separate Node 20 Firebase Functions workspace.
  - Evidence: `package.json`, `functions/package.json`, `functions/tsconfig.json`.
- VERIFIED: Firebase client initialization reads public Expo environment values
  and configures React Native Auth persistence with AsyncStorage.
  - Evidence: `src/firebase/config.ts` (`initializeFirebaseAuth`).
  - Limitation: this is implementation evidence only; native restart behavior
    is not verified in a release build.
- VERIFIED: Secret-like local files are ignored and a public template exists.
  - Evidence: `.gitignore` ignores `.env`, service-account patterns, and
    `*.log`; `.env.example` has empty public Firebase variable names only.
- PARTIALLY VERIFIED: The application has only the repository CI workflow.
  - Evidence: `.github/workflows/ci.yml`; no repository evidence of branch
    protection, required checks, repository secrets, or hosted CI results.

## 3. Implemented and verified

“Verified” in this section means source implementation plus a repository test
or deterministic CI command; it does **not** mean verified in production.

| Application feature | Requested implementation classification | Evidence-based readiness status | Evidence |
| --- | --- | --- | --- |
| Authentication | implemented_but_not_production_verified | PARTIALLY VERIFIED | `AuthContext.tsx`, `AuthScreen.tsx`, `src/firebase/config.ts`. |
| Onboarding | implemented_but_not_production_verified | PARTIALLY VERIFIED | `OnboardingScreen.tsx`, `ProfileContext.tsx`. |
| Profile | implemented_but_not_production_verified | PARTIALLY VERIFIED | `ProfileScreen.tsx`, `profileRepository.ts`. |
| Profile image | implemented_but_not_production_verified | PARTIALLY VERIFIED | `ProfileScreen.tsx`, `storageRepository.ts`; Storage Rules not deployed. |
| Discover | implemented_but_not_production_verified | PARTIALLY VERIFIED | `DiscoverScreen.tsx`, `matchingService.ts`. |
| Connect / Skip | implemented_and_tested | VERIFIED | `swipeRepository.ts`, match Functions E2E. |
| Match | implemented_and_tested | VERIFIED | `matchRepository.ts`, `matchCreation.ts`, Functions E2E. |
| Text chat | implemented_but_not_production_verified | PARTIALLY VERIFIED | `ChatScreen.tsx`, `messageRepository.ts`, Rules coverage. |
| Unread | implemented_and_tested | VERIFIED | `UnreadContext.tsx`, `unread.ts`, unread Functions E2E. |
| Push notification | implemented_but_not_production_verified | PARTIALLY VERIFIED | token/outbox/provider source, push unit/E2E; no real delivery proof. |
| Report | implemented_and_tested | VERIFIED | `UserDetailScreen.tsx`, `safetyRepository.ts`, Rules coverage. |
| Block | implemented_and_tested | VERIFIED | `UserDetailScreen.tsx`, `safetyRepository.ts`, Rules coverage. |
| Moderation | partially_implemented | PARTIALLY VERIFIED | intake/constant model exists; no operator system. |
| Plan / entitlement | partially_implemented | PARTIALLY VERIFIED | entitlement reads and UI exist; no payments or issuer. |
| Account deletion | implemented_and_tested | PARTIALLY VERIFIED | client/processor source and Functions E2E; no production evidence. |
| Settings | partially_implemented | PARTIALLY VERIFIED | profile edit, logout, deletion entry exist; no dedicated settings/support controls. |
| Support route | not_implemented | NOT IMPLEMENTED | no support URL or in-app external route found. |
| Privacy / terms route | not_implemented | NOT IMPLEMENTED | draft docs only; no public or in-app route found. |

- VERIFIED: Static quality gate.
  - Evidence: `package.json` scripts `test:types`, `lint`, `format:check`;
    `.github/workflows/ci.yml` job `static-quality`.
  - Commands: `npm run test:types`; `npm run lint`; `npm run format:check`.
- VERIFIED: Firestore Rules test suite contains 75 explicit allow/deny cases
  across 11 sections.
  - Evidence: `rules-tests/firestore.test.mjs` calls `await check(...)` 75
    times; `package.json` script `test:rules`; CI job `firebase-rules`.
  - Command: `npm run test:rules`.
  - Scope: profiles, swipes, matches, messages, member states, entitlements,
    blocks, reports, admin-reserved collections, deletion requests, and push
    tokens.
- VERIFIED: Function unit coverage for push policy and deletion retry policy.
  - Evidence: `functions/tests/push.unit.mjs` (18 assertions) and
    `functions/tests/accountDeletion.unit.mjs` (3 assertions).
  - Commands: `npm --prefix functions run test:push:unit` and
    `npm run test:account-deletion:unit`; CI job `functions-unit`.
- VERIFIED: Functions emulator E2E commands are defined and included in CI.
  - Evidence: `scripts/functions_unread_e2e.mjs`,
    `scripts/functions_match_creation_e2e.mjs`,
    `scripts/functions_account_deletion_e2e.mjs`,
    `scripts/functions_push_e2e.mjs`; CI job `functions-e2e`.
  - Commands: `npm run test:functions:unread`, `test:functions:match`,
    `test:functions:account-deletion`, and `test:functions:push`.
  - Limitation: this inventory did not execute emulator tests and has no hosted
    CI result evidence.
- VERIFIED: Authentication UI and email/password client flow are implemented.
  - Evidence: `src/context/AuthContext.tsx` (`signIn`, `signUp`, `signOut`),
    `src/screens/AuthScreen.tsx`.
- VERIFIED: Onboarding, profile editing, discoverability, profile display, and
  profile completeness UI are implemented.
  - Evidence: `src/screens/OnboardingScreen.tsx`, `src/screens/ProfileScreen.tsx`,
    `src/context/ProfileContext.tsx`, `src/repositories/profileRepository.ts`.
- VERIFIED: Discover ranking, Connect/Skip writes, server-created mutual match,
  match list, and 1:1 realtime text chat are implemented.
  - Evidence: `src/services/matchingService.ts`, `src/repositories/swipeRepository.ts`,
    `functions/src/matchCreation.ts`, `src/repositories/matchRepository.ts`,
    `src/repositories/messageRepository.ts`.
  - Test evidence: Functions match E2E includes one-sided, mutual, idempotency,
    and Skip cases.
- VERIFIED: In-app unread count and push outbox handoff are implemented.
  - Evidence: `src/context/UnreadContext.tsx`, `functions/src/unread.ts`,
    `functions/src/notificationOutbox.ts`.
  - Test evidence: unread E2E asserts unread increment and outbox creation.
- VERIFIED: Block and report client flows plus Firestore client denial for
  moderation collections are implemented.
  - Evidence: `src/screens/UserDetailScreen.tsx`, `src/repositories/safetyRepository.ts`,
    `firestore.rules`, rules test sections for blocks/reports/moderation.
- VERIFIED: User-initiated account-deletion request, re-authentication,
  scheduled trusted processor, retries, terminal failure state, and audit
  collection writes are implemented in source.
  - Evidence: `src/screens/AccountDeletionScreen.tsx`,
    `functions/src/accountDeletionProcessor.ts` (`processDeletion`,
    `processAccountDeletionRequests`, `scheduleAccountDeletionRequest`).
  - Test evidence: deletion E2E covers completed, retryable, terminal failure,
    auth ordering, scoped data cleanup, and audit output.

## 4. Implemented but not production-verified

- PARTIALLY VERIFIED: Firebase Authentication, Firestore, and Storage client
  integration.
  - Evidence: `src/firebase/config.ts`, repository layer under `src/repositories/`.
  - Missing evidence: enabled production services, IAM, billing, deployed rules,
    indexes, real-project smoke test, and rollback procedure.
- PARTIALLY VERIFIED: Profile image selection/upload.
  - Evidence: `src/screens/ProfileScreen.tsx` requests media permission;
    `src/repositories/storageRepository.ts` uploads
    `profilePhotos/{uid}/avatar.jpg`.
  - Missing evidence: deployed `storage.rules`, production bucket policy, size
    limit, MIME/content validation beyond a fixed client content type, image
    scanning, and real-device permission verification.
- PARTIALLY VERIFIED: Push registration and delivery architecture.
  - Evidence: `src/repositories/pushTokenRepository.ts`,
    `functions/src/pushProcessor.ts`, `functions/src/push/expoProvider.ts`.
  - Verified implementation properties: device-scoped token records, a
    transactional lease, idempotency key, exponential retry (max 5), terminal
    failures, receipt checks, and structured Functions logs.
  - Missing evidence: EAS project ID/configuration, Functions
    `EXPO_ACCESS_TOKEN` secret, real Android/iOS token, real delivery,
    notification tap routing, failure alerting, and production deployment.
- PARTIALLY VERIFIED: Account deletion processing.
  - Evidence: `functions/src/accountDeletionProcessor.ts` performs profile,
    push-token, outbox, storage-prefix, and Firebase Auth cleanup with retries
    and writes `accountDeletionAudit`.
  - Missing evidence: deployed Function, reviewed retention policy, complete
    shared-message/report/moderation-data policy, customer completion notice,
    operator procedure, and production-run evidence.
  - Documentation discrepancy: `README.md` and some draft documents still call
    this processor unimplemented; source and E2E test evidence are newer. The
    documents need reconciliation before release, but were not changed here.
- PARTIALLY VERIFIED: Plan/entitlement presentation.
  - Evidence: `src/repositories/entitlementRepository.ts`, `PlanBadge`,
    `UpgradeHintCard`, `src/config/planLimits.ts`.
  - Missing evidence: entitlement issuer, subscription/payment flow, receipts,
    server enforcement, and support/refund policy.
- PARTIALLY VERIFIED: Local sanitized application diagnostics and Functions
  structured logs.
  - Evidence: `src/utils/errorLogging.ts`, `src/utils/logging.ts`,
    `functions/src/pushProcessor.ts` (`logger.info`/`logger.warn`).
  - Missing evidence: external error capture, dashboards, alerts, retention,
    on-call ownership, and production log access policy.

## 5. Partially implemented

| Area | Status and evidence | Missing production work |
| --- | --- | --- |
| Authentication | PARTIALLY VERIFIED — email/password and AsyncStorage persistence code in `src/firebase/config.ts` / `AuthContext.tsx`. | Native restart, token-refresh, offline, account recovery, and release-build verification. |
| Onboarding/profile | PARTIALLY VERIFIED — forms and Firestore writes exist. | Real-project abuse/validation limits and native QA. |
| Discover/Connect/Skip/match | PARTIALLY VERIFIED — ranking and server match trigger exist. | Deployed Function/rules, load limits, abuse controls, real two-user smoke test. |
| Chat/unread | PARTIALLY VERIFIED — realtime messages, block check, 100-message window, unread trigger. | Message maximum length rule/client limit, rate limit, production Function deployment, monitoring. |
| Report/block/moderation | PARTIALLY VERIFIED — report intake and block enforcement exist. | Operator access path, review queue, RBAC/MFA, action execution, appeal, evidence retention, user notices. |
| Account deletion | PARTIALLY VERIFIED — trusted processor source and E2E exist. | Production policy/deployment/operations and public deletion URL. |
| Support/privacy/terms | NOT VERIFIED — only draft docs with `*.example.invalid` contacts; no in-app or public external links found. | Reviewed public URLs, operator identity/contact, deletion page, store-policy submissions. |
| Emulator/deploy | PARTIALLY VERIFIED — Firestore emulator configured in `firebase.json`. | Functions emulator configuration details, Storage emulator/rules deployment, staging/prod projects and deploy workflow. |

## 6. Not implemented

- NOT IMPLEMENTED: `eas.json`, Android application ID, iOS bundle identifier,
  Android `versionCode`, iOS build number, EAS project ID, preview/production
  build profiles, submit profiles, signing configuration, and native project
  files. Evidence: repository file inventory and `app.json`.
- NOT IMPLEMENTED: App Check, Crashlytics, Analytics, Remote Config, Firebase
  Cloud Messaging configuration, and production Firebase secret configuration.
  Evidence: no matching configuration or source integration in the repository.
- NOT IMPLEMENTED: Storage Rules deployment configuration. Only
  `storage.rules.example` exists; `firebase.json` references only Firestore
  Rules and Functions source.
- NOT IMPLEMENTED: Staging/production Firebase environment separation and
  deploy promotion/rollback configuration.
- NOT IMPLEMENTED: Production moderation console/workflow, admin custom claims
  implementation, admin MFA evidence, appeals, moderator notes, evidence
  retention policy, or user enforcement notifications.
- NOT IMPLEMENTED: Public privacy policy, terms, community guidelines, support
  page, account-deletion URL, store listing metadata/screenshots, developer
  accounts, and store-review accounts.
- NOT IMPLEMENTED: Voice/video/audio calls, real AI assistance, payments,
  subscriptions, advanced recommendation operations, and large admin dashboard.

## 7. Security and dependency status

- PARTIALLY VERIFIED: Firestore access controls are comprehensive locally.
  - Evidence: `firestore.rules` has explicit rules for profiles, tokens,
    swipes, matches/messages/member states, entitlements, blocks, reports,
    admin-reserved data, deletion requests/audit, and default deny; 75 Rules
    cases are defined.
  - Missing evidence: deployment to production and real-project verification.
- PARTIALLY VERIFIED: Input controls exist for empty chat messages, message
  membership/block checks, report reason, profile/swipe IDs, and Rules field
  allowlists.
  - Evidence: `src/repositories/messageRepository.ts`,
    `src/repositories/safetyRepository.ts`, `firestore.rules`.
  - P1 gap: no repository evidence of a maximum chat-message length, upload
    byte-size limit, server-side MIME inspection, request-rate limiting, or
    broad abuse throttling.
- PARTIALLY VERIFIED: Secrets are excluded from Git and the client uses only
  `EXPO_PUBLIC_*` configuration.
  - Evidence: `.gitignore`, `.env.example`, `src/firebase/config.ts`.
  - P0 gap: production Functions secret provisioning/rotation and access
    controls are not documented. `functions/README.md` requires
    `EXPO_ACCESS_TOKEN` but no secret configuration is present.
- NOT VERIFIED: Production and development dependency vulnerability state.
  - Evidence: lockfiles exist, but no committed audit report or CI audit step.
  - Required action: run and triage an approved production/development audit in
    the release process; do not claim remediation from this repository.
- NOT IMPLEMENTED: App Check, backup/restore evidence, incident response,
  security alerting, and production rate limits.
- VERIFIED: Push processor and account-deletion processor contain retries,
  leases/idempotency, terminal failure states, and audit/log records in source.
  - Evidence: `functions/src/pushProcessor.ts`, `notificationOutbox.ts`,
    `accountDeletionProcessor.ts`.

## 8. Mobile release readiness

| Item | Status | Evidence or absence |
| --- | --- | --- |
| Expo app manifest | VERIFIED | `app.json` exists. |
| Name/slug/version | VERIFIED | `app.json`: `langexchange_mobile`, version `1.0.0`. |
| Icon/splash/adaptive icon | PARTIALLY VERIFIED | `assets/icon.png`, `assets/splash-icon.png`, Android adaptive-icon assets are referenced; no native/store validation evidence. |
| Android package name | NOT IMPLEMENTED | No `android.package` in `app.json`. |
| iOS bundle identifier | NOT IMPLEMENTED | No `ios.bundleIdentifier` in `app.json`. |
| Android versionCode / iOS buildNumber | NOT IMPLEMENTED | Not present in `app.json`. |
| Notification icon | NOT IMPLEMENTED | No notification icon configuration found. |
| Scheme/deep links/universal links | NOT IMPLEMENTED | No scheme, associated domains, or navigation URL handling found. |
| EAS project/build/submit | NOT IMPLEMENTED | No `eas.json`, `extra.eas.projectId`, profiles, or submit configuration. |
| Signing | NOT VERIFIED | No repository evidence. |
| Android/iOS device validation | NOT VERIFIED | QA documents are Web/Expo Go/manual checklists only. |
| Auth after restart | NOT VERIFIED | Persistence code exists, but no native device/release test evidence. |
| Background/foreground, token refresh, notification tap | NOT VERIFIED | No test or implementation evidence of lifecycle/tap routing. |
| Photo/notification permissions | PARTIALLY VERIFIED | Permission request code exists; real-device evidence absent. |
| Network failure/small screen/keyboard/Safe Area | PARTIALLY VERIFIED | Error helpers and `SafeAreaProvider` exist; no device matrix evidence. |
| Release build | NOT VERIFIED | No EAS/native build configuration or artifact evidence. |

## 9. Legal and store-policy readiness

- NOT VERIFIED: Privacy Policy, Terms, and retention policy suitable for public
  use.
  - Evidence: `docs/privacy_policy_draft.md`, `docs/terms_draft.md`, and
    `docs/data_retention_policy_draft.md` explicitly say they are drafts,
    require legal review, and contain placeholder contacts.
- NOT IMPLEMENTED: Community Guidelines / child-safety policy / public support
  page / public account-deletion page / developer contact URL.
  - Evidence: no public page or in-app `Linking` route found. Draft terms list
    prohibited conduct but are not public policy evidence.
- NOT IMPLEMENTED: Google Play Data Safety material, Apple App Privacy material,
  screenshots, store metadata, review account, and store developer-account
  evidence.
- NOT VERIFIED: Account deletion policy compliance.
  - Evidence: source processor exists, but no public URL, finalized retention
    schedule, production process, legal review, or completion-notification
    evidence exists.
- PARTIALLY VERIFIED: The current owner’s commercial use is not a LICENSE
  blocker because the repository owner, copyright holder, and intended operator
  are the same person.
  - P2 follow-up: document IP ownership/licensing for incorporation, joint
    operation, transfer, contributors, or external contractors.

## 10. Operations and monitoring readiness

- PARTIALLY VERIFIED: Local application error categorization/redaction and
  Functions structured push logs.
  - Evidence: `src/utils/errorLogging.ts`, `functions/src/pushProcessor.ts`.
- NOT IMPLEMENTED: Crashlytics/Sentry or other external crash reporting,
  metrics, tracing, dashboards, alerting, budget alerts, push failure alerts,
  deletion failure alerts, on-call, SLO/SLA, incident response, rollback
  runbook, backup/restore procedure, support workflow, and production release
  runbook.
  - Evidence: `docs/observability_error_logging_baseline.md` explicitly labels
    the current approach local-first and lists these gaps.
- PARTIALLY VERIFIED: A scheduled processor can retry push/deletion work.
  - Evidence: `retryNotificationOutbox` and `processAccountDeletionRequests`
    are `onSchedule('every 5 minutes')` exports.
  - Missing evidence: deployed scheduler, permissions, alerting, capacity,
    ownership, and recovery playbook.

## 11. Commercial release blockers

| Priority | Blocker | Evidence | Required release effect |
| --- | --- | --- | --- |
| P0 | No verified production Firebase project, Rules/Storage Rules/Functions deployment, IAM, secrets, or environment separation. | `firebase.json`, absence of environment/deploy files; README states deployment is not confirmed. | Establish isolated staging and production projects; deploy and smoke-test safely. |
| P0 | No Android/iOS release build path or identifiers. | `app.json`; no `eas.json`. | Create and validate signed release builds before store submission. |
| P0 | No public, legally reviewed privacy/terms/support/deletion pages. | Draft files only; no public URLs or in-app links. | Publish approved pages and supply valid store URLs. |
| P0 | No deployed Storage Rules; profile-photo uploads would lack repository proof of a production access boundary. | `storage.rules.example` only. | Review, deploy, and test canonical Storage Rules. |
| P0 | No production monitoring/alerting, incident response, or backup/restore evidence. | `docs/observability_error_logging_baseline.md`; no configuration. | Establish minimum operational ownership before live user data. |
| P0 | No App Check or production abuse/rate-limit controls. | No App Check config; no rate-limit implementation. | Protect public Firebase endpoints and define abuse response before broad access. |
| P1 | Real native Auth persistence, real Push delivery/receipt/tap handling, permissions, lifecycle, and release-build QA are unverified. | Source implementation exists; no device/build evidence. | Complete device matrix and retain results. |
| P1 | Moderation has intake but no operator workflow/RBAC/MFA/appeal/enforcement evidence. | `functions/src/moderation.ts` is constants only; Rules deny normal clients. | Provide a minimum trusted review process before user-generated-content launch. |
| P1 | Dependency audit state is not recorded or gated. | No audit artifact/CI check. | Run approved audit, triage results, and record accepted risk/remediation. |
| P1 | Account deletion lacks public URL, finalized retention decisions, deployed process, and operator/customer workflow. | Source/E2E exist; drafts and public URL absent. | Finalize legal/process requirements and validate in production. |
| P2 | Operating entity and intellectual-property documentation for future corporate operation, joint operation, transfer, contributors, or contractors. | Owner/copyright holder/intended operator are currently confirmed as the same person; no third-party rights evidence is needed for that current fact. | Document ownership or licenses before the operating model or contributor set changes. |
| P2 | Branch protection, hosted CI result evidence, coverage, CodeQL, and Dependabot have no repository evidence. | `.github` contains only `workflows/ci.yml`. | Configure repository governance after P0/P1 delivery. |
| P3 | Payments, real AI assistance, calls, advanced recommendations, and large admin dashboard are absent. | README and source. | Keep deferred from first release. |

## 12. Recommended execution order

1. **P0 — choose release owner, target countries, support contact, and
   staging/production Firebase project boundaries**; create an access/secret
   ownership record outside source control.
2. **P0 — make production Firebase deployable safely**: canonical Firestore
   and Storage Rules, Functions configuration/secrets, IAM, billing limits,
   deployment promotion, rollback, and production smoke tests.
3. **P1 — perform approved dependency security audit and triage**; record
   outcomes without indiscriminate upgrades.
4. **P0 — add EAS/native release configuration and application identifiers**;
   produce an Android preview/internal build first.
5. **P1 — run native device QA**: sign-in persistence after restart,
   photo permission/upload, denied permissions, network loss, Safe Area,
   keyboard, small screens, foreground/background, token refresh.
6. **P1 — validate real Push end-to-end** with production credentials:
   permission, registration, delivery, receipt, invalid token, tap/deep link,
   and alert path.
7. **P0 — implement/enable App Check and minimum abuse controls**: message and
   upload limits, rate limiting, account/report abuse handling, and review
   ownership.
8. **P1 — establish minimum moderation operations**: trusted report review,
   operator RBAC/MFA, warning/suspension/ban execution, evidence retention,
   appeals, audit log, and user notices.
9. **P0 — finalize and publish legal/store pages**: privacy, terms,
    community/child-safety standards, support, retention, and public deletion
    request/status URL.
10. **P1 — complete account-deletion production rehearsal** against staging:
    retention decisions, deletion/anonymization scope, notification, audit,
    retry/terminal handling, and manual recovery.
11. **P0 — establish observability and operations**: crash/error reporting,
    Functions logs/alerts, budget alert, Push/deletion failure alerts, backup/
    restore, incident response, release and support runbooks.
12. **P1 — Android internal then closed testing**; collect device, policy, and
    support evidence before Android production submission.
13. **P1 — create iOS release build and TestFlight validation**; then complete
    App Store submission only after equivalent native evidence.
14. **P2 — document operating-entity and intellectual-property relationships**
    before incorporation, joint operation, transfer, contribution, or external
    contracting; no third-party authorization is currently required.
15. **P2 — strengthen repository governance**: branch protection, hosted CI
    evidence, coverage strategy, CodeQL/Dependabot decision, and scheduled
    dependency review.

## 13. Release scope for the first commercial version

Include only after all applicable P0/P1 blockers are closed:

- PARTIALLY VERIFIED: email/password authentication; onboarding and profile;
  profile image; Discover; Connect/Skip; mutual match; text chat; in-app
  unread; block; report; Push architecture; and account deletion workflow.
- Scope condition: Push and deletion must be described as included only after
  their real production end-to-end verification, public-policy, and operating
  requirements are complete.
- Scope condition: plan/entitlement UI remains display/limit behavior only;
  do not market it as a purchasable subscription without a payment backend.

## 14. Deferred scope

- NOT IMPLEMENTED: video call, audio call/voice message, real AI translation/
  correction/reply generation, subscription purchase/payment, advanced
  recommendation operations, and a large admin dashboard.
- P3: broader analytics/experimentation and non-essential premium features.
- Rationale: these are not required to prove the safety, legal, operational,
  native-release, or core text-chat path of the first commercial version.

## 15. Evidence and verification commands

- Repository baseline commands executed for this inventory:

  ```bash
  git branch --show-current
  git status --short
  git rev-parse HEAD
  git rev-parse origin/main
  ```

- Repository-defined quality commands (not rerun by this documentation-only
  assessment):

  ```bash
  npm run test:types
  npm run lint
  npm run format:check
  npm run test:rules
  npm --prefix functions run test:push:unit
  npm run test:account-deletion:unit
  npm run test:functions:unread
  npm run test:functions:match
  npm run test:functions:account-deletion
  npm run test:functions:push
  npx expo export --platform web
  npm --prefix functions run build
  ```

- CI evidence: `.github/workflows/ci.yml` defines five independent jobs:
  `static-quality`, `firebase-rules`, `functions-unit`, `functions-e2e`, and
  `web-build`. This is configuration evidence only; no hosted-run result is
  claimed here.
- Documentation change validation for this inventory:

  ```bash
  git status --short
  git diff --check
  git diff -- docs/production-readiness-inventory.md
  ```
