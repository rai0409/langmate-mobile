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
- Filtering Discover/Matches by blocks (blocks are recorded but not yet
  enforced in queries)

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

1. `cp .env.example .env`
2. Fill in the Firebase config values
3. `npm install`
4. `npm run web` (or `npx expo start`)
5. Sign up with a new email/password
6. Complete onboarding (name, languages, level, goal, bio) and save
7. Browse Discover (with a second account discoverable you see real profiles;
   otherwise clearly-labeled preview data)
8. Connect with a profile (with two accounts connecting to each other, a match
   is created)
9. Open Matches
10. Open Chat from a match
11. Send a message (it appears in realtime for both accounts)
12. Tap Translate / Correct / Suggest Reply in the chat support bar
13. Open a profile via View Profile and test Report and Block
