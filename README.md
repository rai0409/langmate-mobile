# LangMate — Language Exchange Matching App

LangMate is a mobile-first language exchange matching app. Learners create a
profile with their native and target languages, discover compatible partners
through reciprocal language matching, connect with each other, and practice
together in realtime chat with a lightweight learning-support UI.

This is an original MVP inspired by the general product category of language
exchange apps. No third-party branding, UI, text, or assets are copied.

## Tech stack

* Expo SDK 56 (managed workflow)
* React Native 0.85 + React 19
* TypeScript (strict)
* Firebase Auth (email/password)
* Cloud Firestore
* Firebase Storage for profile photos
* Expo Image Picker for selecting profile photos
* React Navigation (native stack + bottom tabs)
* React Context for auth and current-profile state
* React Native StyleSheet for styling (no UI framework)

## Features implemented

* Email/password signup and login with clear error states
* Profile onboarding: display name, native/target language, level, learning
  goal, interests, availability, country, bio, discoverability toggle
* Free/premium plan foundation with optional `entitlements/{uid}` reads
  (missing entitlements default to free; real payments are not implemented)
* Plan-limited language selection: free users can select one native and one
  target language; premium entitlements allow more language selections
* Profile photo upload:

  * users can select a profile photo from the device/browser
  * the photo is uploaded to Firebase Storage
  * the profile document stores `photoURL`
  * the UI falls back to initials when no photo exists
* Shared `ProfileAvatar` display in profile-related screens
* Discover: ranked partner recommendations with a transparent match score and
  "why matched" reasons; Skip / Connect / View Profile
* Reciprocal matching logic (your target language ↔ their native language)
* Connect flow: a match is created only when both users choose Connect
* Matches list with last message preview
* In-app unread message counts with per-match badges and a Matches tab badge
* Matches → UserDetail navigation
* Chat → UserDetail navigation from the chat header/avatar
* Realtime 1:1 chat using Firestore listeners
* Stable chat sending:

  * empty/whitespace messages are rejected
  * duplicate sends are prevented while a send is already in progress
  * send failures are shown to the user
* Learning support bar in chat: Translate / Correct / Suggest Reply
  (mock previews only — no real AI calls)
* Safety:

  * Report actions with reason selection
  * Block actions with confirmation
  * blocked-state UI in UserDetail/Chat
  * blocked relationships disable chat sending
  * Discover/Matches filter blocked users where supported
* Preview mode: clearly-labeled mock profiles in Discover when Firebase is not
  configured or no real candidates exist (mock data is never written to
  Firestore)
* Setup screen when Firebase env vars are missing (the app never crashes on
  missing config)
* Profile shows the current signed-in email/UID and a clear Logout button for
  safer Web QA account switching
* Local-only moderation fixture workflow
* Local-only account deletion request fixture workflow

## Not implemented yet

* Real AI translation/correction/reply suggestions (buttons show mock previews)
* Push notifications
* Voice messages
* Video/audio calls
* Real payments / paid plan purchase flow
* Production moderation tooling
* Production account deletion processor
* Production Cloud Functions
* Production admin dashboard
* Final legally reviewed privacy policy / terms / retention policy
* App Store / Google Play release flow

## Current local development port

This repository uses **port `8080`** for local Web development.

Recommended local Web startup command:

```bash
cd /home/rai/dev/langexchange/langexchange_mobile
npm run web:8080
```

Open:

```text
http://localhost:8080
```

For WSL / LAN / another device access, use:

```bash
cd /home/rai/dev/langexchange/langexchange_mobile
npm run web:8080:host
```

Then open the host machine's IP address on port `8080`, for example:

```text
http://<your-host-ip>:8080
```

If port `8080` is already in use, check the process first:

```bash
lsof -i :8080 || true
```

Stop only the process you intentionally want to stop, then restart Expo on
port `8080`.

## Setup

1. Create a Firebase project at https://console.firebase.google.com.
2. Enable **Authentication → Email/Password**.
3. Enable **Cloud Firestore**.
4. Enable **Firebase Storage**.
5. Add a **Web app** in Project settings and copy its config values.
6. In this directory:

   ```bash
   cp .env.example .env
   # fill in every EXPO_PUBLIC_FIREBASE_* value from your Firebase web app
   npm install
   ```

### .env variables

```text
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

## Run

Use port `8080` for Web development:

```bash
npm start                         # Expo dev server
npm run web                       # default Web dev server
npm run web:8080                  # Web dev server on port 8080
npm run web:8080:host             # Web dev server on 0.0.0.0:8080
npm run android                   # Android emulator/device
npm run ios                       # iOS simulator/device
npm run test:types                # TypeScript check (tsc --noEmit)
```

## Firebase collections

| Collection                            | Document ID                   | Contents                                 |
| ------------------------------------- | ----------------------------- | ---------------------------------------- |
| `profiles/{uid}`                      | auth uid (never auto-ID)      | Profile, including optional `photoURL`   |
| `entitlements/{uid}`                  | auth uid                      | optional plan entitlement                |
| `swipes/{fromUid_toUid}`              | `${fromUid}_${toUid}`         | skip/connect swipe                       |
| `matches/{matchId}`                   | sorted pair `uidA_uidB`       | memberUids, lastMessage, lastSentAt      |
| `matches/{matchId}/messages/{autoId}` | auto-ID                       | fromUid, text, createdAt                 |
| `matches/{matchId}/memberStates/{uid}` | auth uid                     | unreadCount, lastReadAt, muted           |
| `blocks/{blockerUid_blockedUid}`      | `${blockerUid}_${blockedUid}` | block record                             |
| `reports/{autoId}`                    | auto-ID                       | report record                            |
| `accountDeletionRequests/{uid}`       | auth uid                      | non-destructive account deletion request |

The deployable Firestore rules for these collections are in
`firestore.rules`.

## Firebase Storage

Profile photos are uploaded to Firebase Storage under a user-owned path:

```text
profilePhotos/{uid}/avatar.jpg
```

After upload, the app stores the download URL on the user's profile document:

```text
profiles/{uid}.photoURL
profiles/{uid}.photoUpdatedAt
```

Existing profiles without `photoURL` remain valid and render with initials.

A Storage rules example is provided in:

```text
storage.rules.example
```

The example assumes:

* authenticated users may read profile photos
* only the signed-in owner may write `profilePhotos/{uid}/avatar.jpg`

Before production deployment, review and deploy Storage rules manually.

## Security rules

LangMate's production-oriented Firestore security rules live in:

```text
firestore.rules
```

`firestore.rules.example` should only be treated as a pointer/example if it
exists. The canonical deployable Firestore rules file is `firestore.rules`.

### Firestore rules status

The project includes strict, per-collection Firestore rules intended to protect:

* owner-only profile writes
* discoverable-or-owner profile reads
* swipe `fromUid`/document-id integrity
* member-only match reads
* restricted match updates
* member-only messages
* owner-read member state for in-app unread counts
* non-empty message text
* block records readable by both blocker and blocked
* create-only reports with no client reads
* client denial for reserved admin/moderation collections
* default-deny behavior for unknown paths

Client-side block filtering improves UX, but it is not a complete security
boundary. Production still needs deployed rules and, for stronger guarantees,
server-side enforcement for sensitive workflows.

Unread counts are currently an in-app MVP feature. Message sends increment the
recipient's `matches/{matchId}/memberStates/{uid}.unreadCount` client-side, and
opening a chat marks only the current user's member state read. Production
unread counting and push notifications should move to Cloud Functions for
server authority and reliable notification fanout. Push notifications are not
implemented yet.

### Validate Firestore rules locally

```bash
npm run test:rules
```

This runs the Firebase Emulator with the `demo-langmate` project and executes:

```text
rules-tests/firestore.test.mjs
```

Requires Java, `firebase-tools`, and `@firebase/rules-unit-testing`.

If the emulator cannot start because port `8080` is already in use, check:

```bash
lsof -i :8080 || true
```

Then either stop the conflicting process or configure a different Firestore
emulator port in `firebase.json`. The app's Web development port is also
documented as `8080`, so avoid running Expo Web and the Firestore emulator on
the same host/port at the same time unless the emulator is reconfigured.

### Apply Firestore rules manually

After reviewing and validating:

```bash
firebase deploy --only firestore:rules
```

Then re-run the real two-account E2E flow:

```text
Auth → Profile → Discover → Match → Chat → Report → Block
```

## Storage rules

A Storage rules example exists at:

```text
storage.rules.example
```

Review it before production. A minimal expected policy is:

```text
- authenticated users can read profile photos
- only the owner can write profilePhotos/{uid}/avatar.jpg
```

Deploy Storage rules manually only after review:

```bash
firebase deploy --only storage
```

## Prompt004 hardening

Local hardening applied on top of the initial MVP:

* **Block filtering (client-side).** Discover excludes users you blocked and
  users who blocked you; Matches hides matches whose partner is blocked in
  either direction. This is a UX feature, not a complete security boundary.
* **Query limits.** Discover profiles: 50. Matches: 50. Chat messages: most
  recent 100, rendered oldest-first.
* **Error handling.** Shared safe error handling avoids unsafe stringification
  and surfaces Firestore listener errors in the UI.
* **Preview mode vs real Firebase mode.** Preview mode exists for a
  credential-free demo. Preview data is never written to Firestore.
* **Empty messages** are rejected at the repository level.
* **Firebase config guard.** Missing Firebase config shows a Setup Required
  screen instead of crashing.

## UX and safety hardening

Recent MVP hardening adds:

* Matches screen rows/cards can navigate to the other user's UserDetail screen.
* Chat header/avatar can navigate to the other user's UserDetail screen.
* Chat send is protected against empty messages and duplicate send attempts.
* Report flow includes reason selection:

  * `spam`
  * `harassment`
  * `inappropriate_content`
  * `fake_profile`
  * `other`
* Block flow includes a confirmation and blocked-state UI.
* Chat is disabled when either participant has blocked the other.
* Message repository also rejects blocked-relationship sends.

## Profile photo support

Recent profile-photo support adds:

* `expo-image-picker`
* shared `ProfileAvatar`
* optional `photoURL` / `photoUpdatedAt` profile fields
* Firebase Storage integration
* `profilePhotos/{uid}/avatar.jpg` upload path
* photo display in profile-related UI
* initials fallback for users without profile photos
* `storage.rules.example`

This does not yet include:

* image moderation
* multiple profile photos
* paid photo limits
* server-side image processing
* production Storage rules deployment confirmation

## Moderation workflow status

Current client safety behavior:

* Users can create `reports/{autoId}` from View Profile.
* Users can create `blocks/{blockerUid_blockedUid}`.
* Normal clients cannot read, list, update, or delete reports.
* Normal clients cannot access reserved admin collections such as:
  `reportReviews`, `moderationReviews`, or `userModeration`.

Local-only moderation fixture:

```bash
npm run moderation:fixture
```

The fixture script reads local sample report/review/user-moderation data,
validates shapes, and prints normalized review output. It does not connect to
Firebase, does not require Admin SDK credentials, and does not modify real data.

Production moderation still requires a trusted server-side path, such as:

* Firebase Admin SDK script with service account credentials kept outside the
  Expo app and repository
* Cloud Functions guarded by Firebase Auth custom claims
* an internal admin dashboard backed by server-side Admin SDK access

Do not expose admin review or moderation writes in the normal client app.

## Privacy and account deletion baseline

The project includes a privacy/account-deletion baseline for the Web + Firebase
backend path. Draft documents may exist under `docs/` and require legal review
before public use.

Implemented baseline:

* non-destructive Firestore request record:
  `accountDeletionRequests/{uid}`
* Firestore rules allowing a signed-in user to create/update/get only their own
  deletion request
* Firestore rules denying normal users from listing deletion requests, reading
  another user's request, or deleting request/data records
* local-only fixture validator:

```bash
npm run account-deletion:fixture
```

The fixture does not connect to Firebase and does not delete or modify real data.

Not implemented:

* real Firebase data deletion
* Firebase Auth account deletion
* Admin SDK script
* Cloud Function
* production deletion processor
* legally reviewed retention schedule
* GDPR/APPI/App Store/Play Store compliance claim

Production account deletion requires a trusted server-side workflow.

## Auth logout and Web test-user switching

Profile shows a clear "Signed in as" section with the Firebase Auth email when
available, the current auth UID, and a Logout button. Logout calls the existing
AuthContext Firebase `signOut` flow; after Firebase reports no current user, the
app returns to the Auth screen. No user data is deleted.

For Web QA, always logout before switching from one test user to another:

1. Open Profile and confirm the signed-in email/UID.
2. Tap Logout and wait for the Auth screen.
3. Sign in as the next test user.
4. Reopen Profile and confirm the email/UID changed.

Do not hardcode or paste test-user passwords into app code, artifacts, or QA
notes.

## Web beta QA checklist

Use port `8080` for the local Web QA pass:

```bash
cd /home/rai/dev/langexchange/langexchange_mobile
npx expo start --web --port 8080 -c
```

Then follow the Web beta QA checklist if present, for example:

```text
docs/web_beta_qa_checklist.md
```

Manual browser QA remains pending until the tester runs the checklist and
provides evidence. Do not paste test passwords, secrets, `.env` values, or full
Firebase config values into QA notes.

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
   Web.
3. Complete profile setup for both accounts.
4. Add or update a profile photo from Profile.
5. Fully close Expo Go and reopen it; the signed-in account should remain
   signed in on native.
6. Use Profile → Sign Out, then log back in.
7. Verify Discover, Connect, mutual Match creation, Chat send/receive, Report,
   Block, post-block filtering in Discover/Matches, and blocked-state Chat UI.

## Manual verification checklist

### A. No-Firebase mode

1. Ensure no `.env` exists, or leave the Firebase values empty.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run TypeScript check:

   ```bash
   npm run test:types
   ```

4. Run Web export:

   ```bash
   npx expo export --platform web
   ```

5. Start Web on port `8080`:

   ```bash
   npx expo start --web --port 8080 -c
   ```

6. Confirm SetupRequiredScreen appears and the app does not crash.

### B. Firebase mode

1. Copy and fill `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in the Firebase config values. Never commit `.env`.

3. Start Web on port `8080`:

   ```bash
   npx expo start --web --port 8080 -c
   ```

4. Sign up with a new email/password.

5. Complete onboarding.

6. Open Profile.

7. Select a profile photo.

8. Confirm the photo appears after upload.

9. Confirm other screens still render profiles with either photo or initials.

### C. Two-account match

1. Sign up a second account using another browser profile/device.
2. Complete both profiles.
3. Browse Discover on both accounts.
4. Account A connects to B.
5. Account B connects to A.
6. Confirm a match is created only after mutual Connect.
7. Open Matches.
8. Tap a match row/card and confirm it opens the other user's profile.

### D. Chat

1. Open Matches → Chat.
2. Tap the chat header/avatar and confirm it opens the other user's profile.
3. Send a normal message.
4. Confirm the message appears in realtime for both accounts.
5. Try sending an empty message and confirm it is rejected.
6. Try rapid double-click/tap send and confirm duplicate sends are prevented.
7. Tap Translate / Correct / Suggest Reply and confirm mock previews appear.

### E. Block / report

1. From View Profile, report a user.
2. Confirm the report reason UI appears.
3. Cancel once and confirm nothing is saved.
4. Submit once and confirm a report record is created.
5. Block a user.
6. Confirm block confirmation appears.
7. After blocking, confirm the user is hidden or restricted in supported areas.
8. Confirm Chat input is disabled for the blocked relationship.
9. In preview mode, confirm Connect/Report/Block show "Preview only" behavior
   and write nothing.

### F. Rules and fixtures

Run:

```bash
npm run test:types
npm run test:rules
npm run moderation:fixture
npm run account-deletion:fixture
```

If `npm run test:rules` fails because port `8080` is already in use, stop the
conflicting process or configure a different Firestore emulator port before
re-running the rules test.

## Known local port conflict

Both Expo Web and the Firestore emulator may try to use port `8080`.

This repo uses port `8080` for Expo Web local development. Therefore:

* run Expo Web on `8080` when doing browser QA
* do not run Firestore emulator on the same port at the same time
* if rules tests fail with "port taken", check:

```bash
lsof -i :8080 || true
```

Then stop the conflicting process or update the emulator port in `firebase.json`.

## Current status summary

Current status:

```text
MVP app: implemented
Email/password auth: implemented
Profile onboarding: implemented
Profile photo upload: implemented
Discover/recommendations: implemented
Mutual match creation: implemented
Matches list: implemented
Realtime chat: implemented
Chat send hardening: implemented
Matches/Chat → profile navigation: implemented
Report/Block confirmation: implemented
Blocked-state chat restriction: implemented
Firestore rules: implemented locally, deployment not confirmed
Storage rules: example added, deployment not confirmed
Moderation fixture: local-only
Account deletion fixture: local-only
Push notifications: not implemented
Payments: not implemented
Cloud Functions: not implemented
Admin dashboard: not implemented
App Store / Google Play release: not implemented
```

## License

See [LICENSE](./LICENSE).
