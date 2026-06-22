# Auth Logout UX Hardening

Prompt019 adds a small Web/private-beta auth UX hardening pass for the
Firebase email/password flow.

## What changed

- Profile now shows a clear "Signed in as" section with the signed-in email
  when Firebase provides one, plus the current auth UID.
- If an email is unavailable, Profile shows a safe fallback instead of a blank
  value.
- Profile includes a clear Logout button.
- Logout uses the existing Firebase AuthContext `signOut` flow. When Firebase
  auth state changes to signed out, the root app flow renders the Auth screen.
- Logout shows a disabled "Signing out..." state while the request is in
  progress.
- Auth/profile failures use the local Prompt018 safe error helpers and
  development-only diagnostics.

## Switching Test Users On Web

Use this procedure when switching from Test G to Test H during Web QA:

1. Open Profile for the currently signed-in user.
2. Confirm the "Signed in as" email and UID match the account under test.
3. Tap Logout and wait for the Auth screen.
4. Sign in as the next test user.
5. Open Profile again and confirm the email and UID changed.

Do not paste test passwords into source code, artifacts, screenshots, or
shared QA notes. Keep test credentials outside the repository.

## Web Session Persistence Check

1. Sign in on Web and complete profile setup if needed.
2. Refresh the browser tab.
3. Confirm the app returns to the signed-in flow and Profile still shows the
   same email and UID.
4. Logout.
5. Refresh again and confirm the Auth screen is shown.

Web uses Firebase SDK web persistence. Native Expo Go persistence remains a
separate real-device validation item and is not claimed by Prompt019.

## Expected Prompt020 QA Flow

- Test G signs in, verifies Profile identity, and runs Discover/Connect flows.
- Test G logs out before Test H signs in.
- Test H verifies Profile identity before continuing.
- The QA notes should reference users by test label or UID fragment only, not
  by password or secret.

## Not Implemented

- No real account deletion.
- No Firebase Auth user deletion.
- No Admin SDK or Cloud Functions backend.
- No production observability service.
- No Firebase deploy.
- No iPhone or Android real-device validation claim.
- No public launch readiness claim.
