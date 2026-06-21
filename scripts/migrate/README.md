# Supabase → Firebase Migration

One-time migration scripts to move data from the legacy Supabase project into Firebase (Auth, Firestore, Storage).

## Prerequisites

- Node.js 20+
- Firebase service account JSON with Admin privileges
- Supabase service role key (read-only access to source data is sufficient)
- Blaze plan Firebase project with Auth, Firestore, and Storage enabled

## Setup

```bash
cd scripts/migrate
npm install
cp .env.local.example .env.local   # create and fill in values
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Environment variables (`.env.local`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `FIREBASE_PROJECT_ID` | Target Firebase project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account JSON |
| `DRY_RUN` | Set to `true` to log actions without writing (optional) |
| `MIGRATE_BATCH_SIZE` | Firestore batch size, default `400` (optional) |
| `FIREBASE_EXPERIENCE_BUCKET` | Firebase Storage bucket for experience images (default: `experience-images`) |

## Migration order

Scripts must run in order — dependencies flow from reference data → offers → auth → user data → experiences → operations → claims.

| Step | Script | Description |
|------|--------|-------------|
| 01 | `01-reference-data.ts` | Categories, universities, brands |
| 02 | `02-offers.ts` | Offers |
| 03 | `03-auth-users.ts` | Auth users via `auth.importUsers` (UIDs preserved) |
| 04 | `04-user-data.ts` | Profiles, settings, favorites, saved, claimed, purchases |
| 05 | `05-experiences.ts` | Experience posts, comments, likes, images + Storage copy |
| 06 | `06-operations-data.ts` | Support tickets, team invites, activity log, A/B data |
| 07 | `07-set-custom-claims.ts` | Sync Firebase Auth custom claims from `userRoles` |

## Usage

Run individual steps:

```bash
npm run migrate:01
npm run migrate:02
# ...
```

Run the full pipeline with checkpoint resume:

```bash
npm run run-all
```

Progress is stored in `.migrate-checkpoint.json`. Delete this file to re-run from scratch.

Validate counts after migration:

```bash
npm run validate
```

Dry run (no writes):

```bash
DRY_RUN=true npm run migrate:01
```

## Important notes

- **Passwords**: Supabase password hashes are not exported. Imported users must reset passwords or sign in via a linked provider (e.g. Google).
- **IDs preserved**: Document IDs and Auth UIDs match the Supabase UUIDs.
- **Storage**: Step 05 downloads public Supabase Storage URLs and re-uploads to Firebase Storage.
- **Custom claims**: Step 07 must run after step 04 so `userRoles` documents exist.

## Troubleshooting

- `Missing required environment variable` — check `.env.local`
- Auth import failures — verify the UID does not already exist in Firebase Auth
- Count mismatches in validate — re-run the specific step; check Firestore rules are not blocking Admin SDK writes
