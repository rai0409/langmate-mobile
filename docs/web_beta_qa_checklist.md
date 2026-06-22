# Web Beta QA Checklist

Use this checklist for the LangMate PC Web + Firebase backend private-beta path.
Do not record passwords, secrets, tokens, full Firebase config values, or `.env`
values in notes, screenshots, artifacts, or source code.

## A. Preconditions

- Prompt020 local verification commands pass.
- PC Web is the active validation path.
- iPhone Expo Go remains blocked/deferred.
- iPhone/Android real-device validation is not claimed by this checklist.
- Use test accounts only.
- Do not paste passwords into artifacts or source code.
- Keep Firebase credentials and `.env` values out of QA notes.

## B. Start App

```bash
cd /home/rai/dev/langexchange/langexchange_mobile
npx expo start --web -c
```

Optional export check:

```bash
cd /home/rai/dev/langexchange/langexchange_mobile
npx expo export --platform web
rm -rf dist
```

## C. Test-User Switching

- Test G email: `<TEST_G_EMAIL>`
- Test H email: `<TEST_H_EMAIL>`
- Password: do not write password into docs, artifacts, screenshots, or source.

Always logout before switching users:

1. Open Profile for the current test user.
2. Confirm the signed-in email and UID.
3. Tap Logout.
4. Wait for the Auth screen.
5. Sign in as the next test user.
6. Reopen Profile and confirm the email and UID changed.

## D. Auth / Session / Logout Checks

| Step | Expected result | Status |
| --- | --- | --- |
| Open the Web app | Auth screen appears if signed out | NEEDS USER CONFIRMATION |
| Login or signup as Test G | App advances to onboarding or main tabs | NEEDS USER CONFIRMATION |
| Open Profile | Signed-in email and UID are visible | NEEDS USER CONFIRMATION |
| Tap Logout | Logout button shows progress, then Auth screen appears | NEEDS USER CONFIRMATION |
| Login or signup as Test H | App advances to onboarding or main tabs | NEEDS USER CONFIRMATION |
| Open Profile | Test H email and UID are visible and differ from Test G | NEEDS USER CONFIRMATION |
| Refresh while signed in | Expected signed-in state persists on Web | NEEDS USER CONFIRMATION |
| Logout, then refresh | Auth screen remains visible | NEEDS USER CONFIRMATION |

## E. Profile / Onboarding Checks

| Step | Expected result | Status |
| --- | --- | --- |
| Create or edit Test G profile | Required fields are enforced | NEEDS USER CONFIRMATION |
| Save Test G profile with Country blank | Save succeeds; no crash | NEEDS USER CONFIRMATION |
| Create or edit Test H profile | Required fields are enforced | NEEDS USER CONFIRMATION |
| Save Test H profile with Country blank | Save succeeds; no crash | NEEDS USER CONFIRMATION |
| Toggle discoverability as needed | Profile reflects the selected state | NEEDS USER CONFIRMATION |

## F. Discover / User Detail Checks

| Step | Expected result | Status |
| --- | --- | --- |
| Test G opens Discover | Eligible real profiles appear, or empty state if none | NEEDS USER CONFIRMATION |
| Test G finds Test H while Test H is discoverable | Test H appears as an eligible candidate | NEEDS USER CONFIRMATION |
| Open Test H detail | User detail opens with profile and match reasons | NEEDS USER CONFIRMATION |
| Make Test H non-discoverable, then refresh Discover | Test H should not appear to Test G | NEEDS USER CONFIRMATION |
| Restore Test H discoverable if needed | Test H can reappear after refresh if eligible | NEEDS USER CONFIRMATION |

## G. Connect / Match Checks

| Step | Expected result | Status |
| --- | --- | --- |
| Test G taps Connect on Test H | Connect request sent unless mutual already exists | NEEDS USER CONFIRMATION |
| Logout from Test G | Auth screen appears | NEEDS USER CONFIRMATION |
| Login as Test H | Test H signed-in identity is visible on Profile | NEEDS USER CONFIRMATION |
| Test H taps Connect on Test G | Mutual match is created | NEEDS USER CONFIRMATION |
| Open Matches as Test H | Match with Test G appears | NEEDS USER CONFIRMATION |
| Logout and login as Test G | Test G signed-in identity is visible on Profile | NEEDS USER CONFIRMATION |
| Open Matches as Test G | Match with Test H appears | NEEDS USER CONFIRMATION |

## H. Chat Checks

| Step | Expected result | Status |
| --- | --- | --- |
| Open match chat as Test G | Chat screen opens | NEEDS USER CONFIRMATION |
| Send a non-empty message | Message appears in chat | NEEDS USER CONFIRMATION |
| Try sending an empty message | Empty message is not sent | NEEDS USER CONFIRMATION |
| Switch to Test H | Logout first, then login as Test H | NEEDS USER CONFIRMATION |
| Open match chat as Test H | Test G message is visible | NEEDS USER CONFIRMATION |
| Reply as Test H | Reply appears in chat | NEEDS USER CONFIRMATION |
| Switch back to Test G | Test H reply is visible | NEEDS USER CONFIRMATION |
| Open Matches | Last message preview updates if visible | NEEDS USER CONFIRMATION |

## I. Report / Block Checks

| Step | Expected result | Status |
| --- | --- | --- |
| Open user detail | Report and Block buttons are visible | NEEDS USER CONFIRMATION |
| Tap Report | Report confirmation appears | NEEDS USER CONFIRMATION |
| Confirm reports are not client-readable | No client UI exposes report contents | NEEDS USER CONFIRMATION |
| Tap Block | Block confirmation appears and navigation returns | NEEDS USER CONFIRMATION |
| Refresh Discover | Blocked user disappears where current app filtering supports it | NEEDS USER CONFIRMATION |
| Open Matches | Matches with blocked users are hidden where current app filtering supports it | NEEDS USER CONFIRMATION |
| If a permission error appears | Record screen, action, safe message, and diagnostic category | NEEDS USER CONFIRMATION |

## J. Account Deletion Request Baseline

- Current status is backend/rules/docs baseline only.
- No production deletion processor exists.
- Do not delete real data.
- If no account deletion UI is present, mark this as `NOT IMPLEMENTED` for UI
  and `PASS` only for local rules/fixture verification.

## K. Error Logging / Observability

When a tester hits an error, record:

| Field | Value |
| --- | --- |
| Screen |  |
| Action |  |
| Safe user-facing message |  |
| Developer diagnostic category |  |
| Expected next action |  |

Do not paste secrets, passwords, tokens, `.env` values, full Firebase config
values, or raw personal data. Use test labels or UID fragments where possible.

## L. Pass / Fail Matrix

Use these statuses:

| Status | Meaning |
| --- | --- |
| PASS | User verified the step and observed the expected result |
| FAIL | User verified the step and observed a wrong result |
| BLOCKED | User could not run the step because of setup/runtime constraints |
| NOT IMPLEMENTED | The feature is intentionally absent |
| NEEDS USER CONFIRMATION | Codex prepared the step, but browser evidence is not yet provided |

## M. Evidence To Paste Back

Paste back:

- Terminal output summary from `npx expo start --web -c` or export check.
- Browser used and URL shown by Expo.
- Test G/Test H switching result without passwords.
- Auth/session/logout results.
- Profile/onboarding results.
- Discover/user detail results.
- Connect/match results.
- Chat results.
- Report/block results.
- Account deletion UI status.
- Any failed screen/action with safe user-facing message and diagnostic
  category.

Screenshots are optional. If used, avoid exposing secrets, passwords, tokens,
full Firebase config values, `.env` values, or unnecessary personal data.
