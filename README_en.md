# LangMate — Language Exchange Matching App (MVP)

LangMate is a mobile-first language exchange matching app. Learners create a
profile with their native and target languages, discover compatible partners
through reciprocal language matching, connect with each other, and practice
together in realtime chat with a lightweight learning-support UI.

This is an original MVP inspired by the general product category of language
exchange apps. No third-party branding, UI, text, or assets are copied.

## Tech stack

- Expo SDK 56 (managed workflow)
- React Native 0.85 + React 19
- TypeScript (strict)
- Firebase Auth (email/password)
- Cloud Firestore (profiles, swipes, matches, messages, blocks, reports)
- React Navigation (native stack + bottom tabs)
- React Context for auth and current-profile state
- React Native StyleSheet for styling (no UI framework)

## Features implemented

- Email/password signup and login with clear error states
- Profile onboarding: display name, native/target language, level, learning
  goal, interests, availability, country, bio, discoverability toggle
- Discover: ranked partner recommendations with a transparent match score and
  "why matched" reasons; Skip / Connect / View Profile
- Reciprocal matching logic (your target language ↔ their native language)
- Connect flow: a match is created only when both users choose Connect
- Matches list with last message preview
- Realtime 1:1 chat (Firestore listeners)
- Learning support bar in chat: Translate / Correct / Suggest Reply
  (mock previews only — no real AI calls)
- Safety: Report and Block actions on user detail
- Preview mode: clearly-labeled mock profiles in Discover when Firebase is not
  configured or no real candidates exist (mock data is never written to
  Firestore)
- Setup screen when Firebase env vars are missing (the app never crashes on
  missing config)
- Profile shows the current signed-in email/UID and a clear Logout button for
  safer Web QA account switching

## Not implemented yet

- Real AI translation/correction/reply suggestions (buttons show mock previews)
- Push notifications
- Media upload (avatars are initials only)
- Voice messages
- Deployed Firestore security rules (production-oriented rules exist and are
  emulator-validated in `firestore.rules`, but are not yet deployed — see
  **Security rules** below)
- Production moderation tooling
- Production account deletion processor
- Final legally reviewed privacy policy / terms / retention policy
- Video/audio calls
- Payments

## Prompt004 hardening

Local hardening applied on top of the Prompt001 MVP (no Firebase credentials
required for any of it):

- **Block filtering (client-side).** Discover excludes users you blocked and
  users who blocked you; Matches hides matches whose partner is blocked in
  either direction (`listBlocksForUser` / `listenBlocksForUser` in
  `src/repositories/safetyRepository.ts` — two single-field queries merged, no
  composite index needed). If the block list fails to load, the screens stay
  usable and show a non-fatal warning. **This is a UX feature, not a security
  boundary** — production still needs deployed Firestore rules and/or server
  enforcement (see **Security rules** below; `firestore.rules`).
- **Query limits.** Discover profiles: 50 (`listDiscoverableProfiles`).
  Matches: 50 (`listMatchesForUser` / `listenMatchesForUser`). Chat messages:
  most recent 100, still rendered oldest-first (`listenMessages` uses
  `orderBy createdAt asc` + `limitToLast`). All limits are overridable
  parameters.
- **Error handling.** Shared `getErrorMessage` (`src/utils/errorMessage.ts`)
  returns safe human-readable messages and never stringifies arbitrary
  objects; `logDevError` (`src/utils/logging.ts`) logs concise context-tagged
  warnings in development only. Firestore listeners now surface errors to the
  UI (Matches/Chat warnings) instead of failing silently. Missing Firebase
  config produces: "Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_*
  values to .env and restart Expo."
- **Preview mode vs real Firebase mode.** Preview mode exists for a
  credential-free demo: with no `.env`, Discover shows clearly-labeled mock
  profiles and **preview data is never written to Firestore** — Connect,
  Report, and Block on preview profiles show a "Preview only — nothing was
  saved" notice instead of writing. Real mode requires the
  `EXPO_PUBLIC_FIREBASE_*` values in `.env`.
- **Empty messages** are rejected at the repository level (trimmed before
  writing; empty text throws a friendly error).
- **Firebase E2E remains pending.** Nothing in this hardening pass has been
  verified against a real Firebase project yet; `firestore.rules.example`
  remains example-only and undeployed.

## Setup

1. Create a Firebase project at <https://console.firebase.google.com>.
2. Enable **Authentication → Email/Password** and **Cloud Firestore**.
3. Add a **Web app** in Project settings and copy its config values.
4. In this directory:

   ```bash
   cp .env.example .env
   # fill in every EXPO_PUBLIC_FIREBASE_* value from your Firebase web app
   npm install
   ```

### .env variables

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Expo inlines `EXPO_PUBLIC_*` variables at build time — restart the dev server
after changing `.env`. Without config the app shows the Setup Required screen.

Note: on native Expo Go builds, Firebase Auth is initialized with
`@react-native-async-storage/async-storage` so email/password sessions should
survive a full Expo Go restart. Web keeps the Firebase SDK default persistence.

## Security rules

LangMate's production-oriented Firestore security rules live in
**`firestore.rules`** (the canonical, deployable file; `firestore.rules.example`
is now just a pointer to it to avoid drift).

- **Status.** Prompt006 verified the full app E2E against real Firebase, but
  that ran under **permissive E2E rules** (effectively
  `allow read, write: if request.auth != null;`). **Do not use permissive
  rules in production.** Prompt007 introduces strict, per-collection rules and
  validated them locally with the Firebase Emulator.
- **What the rules enforce.** Owner-only profile writes + discoverable-or-owner
  reads; swipe `fromUid`/doc-id integrity with both-sides read for the
  mutual-connect check; member-only matches with updates restricted to
  `lastMessage`/`lastSentAt`/`updatedAt` and immutable membership; member-only
  messages with non-empty text and real `fromUid`; blocks readable by both
  blocker and blocked (needed for two-direction filtering); create-only
  reports with no client reads; admin-only moderation collections denied to
  clients; default-deny everywhere else.

### Validate rules locally

```bash
npm run test:rules
```

Runs the Firebase Emulator (no real project, no credentials — uses the
`demo-langmate` emulator project) and executes `rules-tests/firestore.test.mjs`.
Requires Java (the Firestore emulator is a JVM process) and the dev
dependencies `firebase-tools` + `@firebase/rules-unit-testing`. Prompt007 run:
**33 passed, 0 failed**.

### Apply rules (manual, after validation)

Prompt007 does **not** deploy. After reviewing and re-validating, deploy
manually:

```bash
firebase deploy --only firestore:rules
```

Then re-run the real two-account E2E (Auth → Profile → Discover → Match →
Chat → Report → Block) against the enforced rules, including the block
filtering recheck (`artifacts/mobile_mvp/prompt007_block_filtering_recheck_plan.md`).

### Reminders & remaining production needs

- `.env` must remain git-ignored (it is — never commit or print it).
- Still needed before a real launch: an **admin moderation workflow**
  (reports are write-only from clients and need server-side review),
  optionally **Cloud Functions / server-side enforcement of mutual-match
  creation** for stronger guarantees, and **production monitoring/logging**.

## Moderation workflow status

Current client safety behavior:

- Users can create `reports/{autoId}` from View Profile.
- Users can create `blocks/{blockerUid_blockedUid}`.
- Normal clients cannot read, list, update, or delete reports.
- Normal clients cannot access reserved admin collections:
  `reportReviews`, `moderationReviews`, or `userModeration`.

Prompt016 adds a **local-only moderation fixture workflow**:

```bash
npm run moderation:fixture
```

The fixture script reads `scripts/fixtures/moderation_reports_fixture.json`,
validates sample report/review/user-moderation shapes, and prints normalized
review output. It does **not** connect to Firebase, does **not** require Admin
SDK credentials, and does **not** modify real data.

Production moderation still requires a server-side admin path, such as:

- Firebase Admin SDK script with service account credentials kept outside the
  Expo app and repository.
- Cloud Functions guarded by Firebase Auth custom claims.
- An internal admin dashboard backed by server-side Admin SDK access.

Do not expose admin review or moderation writes in the normal client app.
Before public launch, reports need a real admin review/triage/action workflow,
audit trail, and operational policy.

## Privacy and account deletion baseline

Prompt017 adds a privacy/account-deletion baseline for the Web + Firebase
backend path. These documents are drafts only and require legal review before
public use:

- `docs/privacy_policy_draft.md`
- `docs/terms_draft.md`
- `docs/account_deletion_policy_draft.md`
- `docs/data_retention_policy_draft.md`

What is implemented:

- A non-destructive Firestore request record:
  `accountDeletionRequests/{uid}`.
- Firestore rules allowing a signed-in user to create/update/get only their
  own deletion request.
- Firestore rules denying normal users from listing deletion requests, reading
  another user's request, or deleting request/data records.
- Emulator rules tests for the owner-only account deletion request boundary.
- A local-only fixture validator:

```bash
npm run account-deletion:fixture
```

The fixture reads `scripts/fixtures/account_deletion_requests_fixture.json`,
validates request shapes, and prints normalized output. It does **not** connect
to Firebase, does **not** require Admin SDK credentials, and does **not** delete
or modify real data.

What is not implemented:

- No real Firebase data deletion.
- No Firebase Auth account deletion.
- No Admin SDK script, Cloud Function, or production deletion processor.
- No final legally reviewed retention schedule.
- No GDPR/APPI/App Store/Play Store compliance claim.

Production account deletion requires a trusted server-side workflow using
Firebase Admin SDK or Cloud Functions. That workflow must verify identity,
apply the legally reviewed retention policy, delete or anonymize eligible data,
preserve required safety/audit records, and record completion evidence outside
the normal client app.

## Auth logout and Web test-user switching

Prompt019 adds a Web/private-beta auth UX hardening pass. Profile now shows a
clear "Signed in as" section with the Firebase Auth email when available, the
current auth UID, and a Logout button. Logout calls the existing AuthContext
Firebase `signOut` flow; after Firebase reports no current user, the app returns
to the Auth screen. No user data is deleted.

For Web QA, always logout before switching from one test user to another:

1. Open Profile and confirm the signed-in email/UID.
2. Tap Logout and wait for the Auth screen.
3. Sign in as the next test user.
4. Reopen Profile and confirm the email/UID changed.

Do not hardcode or paste test-user passwords into app code, artifacts, or QA
notes. Web session persistence can be checked by signing in, refreshing the
browser tab, confirming the same Profile identity remains visible, logging out,
and refreshing again to confirm the Auth screen is shown.

More detail: `docs/auth_logout_ux_hardening.md`.

## Web beta QA checklist

Prompt020 prepares the PC Web + Firebase backend beta QA pass. Use:

```bash
cd /home/rai/dev/langexchange/langexchange_mobile
npx expo start --web -c
```

Then follow `docs/web_beta_qa_checklist.md`. Manual browser QA remains pending
until the tester runs the checklist and provides evidence. Do not paste test
passwords, secrets, `.env` values, or full Firebase config values into QA notes.

## Firebase collections

| Collection | Document ID | Contents |
| --- | --- | --- |
| `profiles/{uid}` | auth uid (never auto-ID) | Profile |
| `swipes/{fromUid_toUid}` | `${fromUid}_${toUid}` | skip/connect swipe |
| `matches/{matchId}` | sorted pair `uidA_uidB` | memberUids, lastMessage, lastSentAt |
| `matches/{matchId}/messages/{autoId}` | auto-ID | fromUid, text, createdAt |
| `blocks/{blockerUid_blockedUid}` | `${blockerUid}_${blockedUid}` | block record |
| `reports/{autoId}` | auto-ID | report record |
| `accountDeletionRequests/{uid}` | auth uid | non-destructive account deletion request |

The deployable rules for these collections are in `firestore.rules` (see
**Security rules** above).

## Run

```bash
npm start          # Expo dev server (QR code for Expo Go)
npm run web        # run in the browser
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device
npm run test:types # TypeScript check (tsc --noEmit)
```

## Mobile Expo Go testing

Use a real iPhone or Android device on the same Wi-Fi network when possible:

```bash
npx expo start -c
```

If LAN discovery is blocked by the network, use a tunnel:

```bash
npx expo start --tunnel -c
```

Recommended private-beta smoke test:

1. Open the QR code in Expo Go.
2. Sign up or log in with two test accounts on two devices or one device plus
   web.
3. Complete profile setup for both accounts.
4. Fully close Expo Go and reopen it; the signed-in account should remain
   signed in on native.
5. Use Profile -> Sign Out, then log back in.
6. Verify Discover, Connect, mutual Match creation, Chat send/receive, Report,
   Block, and post-block filtering in Discover and Matches.

## Manual verification checklist

### A. No-Firebase mode (no credentials needed)

1. Ensure no `.env` (or empty values)
2. `npm install`
3. `npm run test:types` — passes
4. `npx expo export --platform web` — builds without credentials
5. `npm run web` — SetupRequiredScreen appears; the app does not crash

### B. Firebase mode

1. `cp .env.example .env` and fill in the Firebase config values (never commit `.env`)
2. `npm install`
3. `npx expo start -c` (cache clear so new env values are inlined), then open web/Expo Go
4. Sign up with a new email/password
5. Complete onboarding (name, languages, level, goal, bio) and save

### C. Two-account match

6. Sign up a second account (second browser profile or device) and complete its profile
7. Browse Discover on both (real profiles appear, limited to 50; otherwise
   clearly-labeled preview data)
8. Account A connects to B, then B connects to A — a match is created only on
   mutual connect

### D. Chat

9. Open Matches → open the Chat
10. Send a message (appears in realtime for both accounts; empty messages are
    rejected; only the most recent 100 messages are loaded)
11. Tap Translate / Correct / Suggest Reply in the chat support bar (mock
    previews only)

### E. Block / report

12. From View Profile, account A blocks B → A is navigated back, and B
    disappears from A's Discover and Matches
13. Report a profile → confirmation appears; a record lands in `reports/{autoId}`
14. In preview mode (no Firebase), Connect/Report/Block show "Preview only —
    nothing was saved" and write nothing
