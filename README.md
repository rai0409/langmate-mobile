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

## Not implemented yet

- Real AI translation/correction/reply suggestions (buttons show mock previews)
- Push notifications
- Media upload (avatars are initials only)
- Voice messages
- Deployed Firestore security rules (see `firestore.rules.example`)
- Production moderation tooling
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
  enforcement (see `firestore.rules.example`).
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

Note: with the Firebase JS SDK on native, auth state persists in memory only
(you sign in again after a full app restart). Web persists via IndexedDB.

## Firebase collections

| Collection | Document ID | Contents |
| --- | --- | --- |
| `profiles/{uid}` | auth uid (never auto-ID) | Profile |
| `swipes/{fromUid_toUid}` | `${fromUid}_${toUid}` | skip/connect swipe |
| `matches/{matchId}` | sorted pair `uidA_uidB` | memberUids, lastMessage, lastSentAt |
| `matches/{matchId}/messages/{autoId}` | auto-ID | fromUid, text, createdAt |
| `blocks/{blockerUid_blockedUid}` | `${blockerUid}_${blockedUid}` | block record |
| `reports/{autoId}` | auto-ID | report record |

`firestore.rules.example` documents the intended security rules. It is an
example only and is not deployed.

## Run

```bash
npm start          # Expo dev server (QR code for Expo Go)
npm run web        # run in the browser
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device
npm run test:types # TypeScript check (tsc --noEmit)
```

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
