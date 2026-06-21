# Firebase Project Setup

Complete guide for configuring the Unidealz Firebase monorepo (Auth, Firestore, Storage, Hosting, App Check, and environment variables).

## 1. Create the Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project (e.g. `unidealz-prod`).
2. Upgrade to the **Blaze** plan (required for Cloud Functions and some Auth features).
3. Note your **Project ID** — used throughout config files.

## 2. Authentication

1. Firebase Console → **Build → Authentication → Sign-in method**
2. Enable providers you need:
   - **Email/Password** (student sign-up)
   - **Google** (optional, recommended)
3. Configure **Authorized domains** for production and localhost.
4. Under **Templates**, customize email templates or use custom auth emails via Cloud Functions (`onAuthEmail`).

### Custom claims (roles)

Roles are stored in Firestore `userRoles` and synced to Auth custom claims (`roles: string[]`):

- `student` — default on signup
- `admin`, `curator`, `analyst` — staff roles

The `beforeUserCreated` trigger sets initial claims; staff invites receive their invited role.

## 3. Cloud Firestore

1. Firebase Console → **Build → Firestore Database → Create database**
2. Start in **production mode** (security rules are in `firestore.rules` at repo root).
3. Deploy rules and indexes:

```bash
npx firebase-tools deploy --only firestore
```

4. Collections are created on first write — see `packages/shared/src/constants/collections.ts` for the full list.

## 4. Cloud Storage

1. Firebase Console → **Build → Storage → Get started**
2. Deploy storage rules:

```bash
npx firebase-tools deploy --only storage
```

3. Create a bucket folder for experience images (default bucket path: `experience-images/`).

Rules are defined in `storage.rules` at the repo root.

## 5. Cloud Functions

1. Enable Cloud Functions (Blaze plan).
2. Functions live in `packages/functions/`.
3. Secrets (Resend API key, etc.) go in `packages/functions/.env.local` (gitignored).

```bash
npm run build:shared
npm run sync:functions
npm run build:functions
npx firebase-tools deploy --only functions
```

## 6. Hosting (two sites)

This monorepo deploys **two separate hosting sites**:

| Site | Package | Firebase hosting site ID |
|------|---------|--------------------------|
| Dashboard (PWA) | `packages/dashboard` | `unidealz-dashboard` |
| Marketing website | `packages/website` | `unidealz-website` |

### Register hosting sites

1. Firebase Console → **Build → Hosting**
2. Add two sites under the same project:
   - `unidealz-dashboard`
   - `unidealz-website`
3. Site IDs must match `firebase.json` hosting config.

### Deploy hosting

```bash
npm run deploy:hosting
```

## 7. Web apps (separate per package)

Create **two web apps** in Firebase Console → Project Settings → Your apps:

1. **Unidealz Dashboard** — for `packages/dashboard`
2. **Unidealz Website** — for `packages/website`

Copy each app's config into the corresponding `.env.production` file.

### Dashboard env vars (`packages/dashboard/.env.production`)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_RECAPTCHA_SITE_KEY=
VITE_USE_EMULATORS=false
```

### Website env vars (`packages/website/.env.production`)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_RECAPTCHA_SITE_KEY=
VITE_USE_EMULATORS=false
```

For local development, copy production templates to `.env.development` and set `VITE_USE_EMULATORS=true`.

## 8. App Check

Callable Cloud Functions enforce App Check (`enforceAppCheck: true`).

1. Firebase Console → **Build → App Check**
2. Register each web app with the **reCAPTCHA v3** provider
3. Copy the **reCAPTCHA site key** into `VITE_RECAPTCHA_SITE_KEY` for dashboard and website
4. Enable enforcement for Cloud Functions when ready for production

## 9. Local emulators

```bash
npm run emulate
```

Default emulator ports (see `firebase.json`):

| Service | Port |
|---------|------|
| Auth | 9099 |
| Functions | 5001 |
| Firestore | 8080 |
| Hosting | 5000 |
| Storage | 9199 |

## 10. Service account (Admin SDK / migration)

For migration scripts or server-side Admin SDK:

1. Firebase Console → Project Settings → Service accounts
2. Generate a new private key JSON
3. Set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`

See `scripts/migrate/README.md` for Supabase → Firebase migration steps.

## Quick checklist

- [ ] Firebase project created (Blaze plan)
- [ ] Auth providers enabled
- [ ] Firestore created, rules deployed
- [ ] Storage enabled, rules deployed
- [ ] Two web apps registered (dashboard + website)
- [ ] Two hosting sites registered
- [ ] App Check configured with reCAPTCHA v3
- [ ] `.env.production` filled for dashboard and website
- [ ] Functions secrets in `packages/functions/.env.local`
- [ ] `firebase use --add` linked to local CLI

## Related docs

- `SETUP_CHECKLIST.md` — placeholder variable replacement
- `scripts/migrate/README.md` — data migration from Supabase
- `AGENTS.md` — codebase conventions
