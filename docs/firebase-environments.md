# Firebase environments

`local`, `staging`, and `production` are explicit application environments.
Firebase projects are created and administered outside this repository.

## Local setup

Copy `.firebaserc.example` to an untracked `.firebaserc`, then replace only the
two placeholders with the staging and production project IDs. Copy
`.env.example` to an untracked `.env`, set `EXPO_PUBLIC_APP_ENV` to one allowed
value, and fill the public Firebase web configuration for that environment.

Firebase client configuration is public application configuration, but it must
not be logged. Functions secrets (for example `EXPO_ACCESS_TOKEN`) are not
client configuration and must never be placed in `.env`, committed, or printed.

## Deploy guard

Run only from clean, up-to-date `main` after selecting the matching Firebase
CLI project alias:

```bash
npm run firebase:preflight:staging
CONFIRM_PRODUCTION_DEPLOY=CONFIRM_PRODUCTION_DEPLOY npm run firebase:preflight:production
```

The preflight performs no deploy and runs no tests. It requires `.firebaserc`,
valid non-placeholder aliases, an active matching Firebase CLI project, clean
Git state, and `HEAD == origin/main`. Production additionally requires the
fixed confirmation token. This change does not create projects, configure
secrets, deploy, or define rollback; rollback is a separate responsibility.

## Storage Rules

`storage.rules` is the formal Firebase Storage Rules deploy target. It protects
the authenticated profile-photo path `profilePhotos/{uid}/avatar.jpg`: any
authenticated user may read, while only the path owner may create, update, or
delete. Uploads must be non-empty JPEG files no larger than 5 MiB.

Run `npm run test:storage-rules` before a production Storage Rules deploy. This
repository change does not deploy Storage Rules or use a real Firebase project.
