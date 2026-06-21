# Unidealz

Curated premium discounts for sophisticated students — Firebase monorepo migrated from the Lovable/Supabase `student-deals-hub` project.

## Structure

```
packages/
  shared/     Shared types, constants, i18n (EN/EL)
  website/    Public SPA — offers, about, contact, legal pages
  dashboard/  Auth, student hub, operations panel (PWA)
  functions/  Firebase Cloud Functions v2
legacy/
  student-deals-hub/  Original Lovable app (reference)
scripts/
  migrate/            Supabase → Firebase migration scripts
```

## Quick start

```bash
npm install
npm run build:shared
npm run dev              # dashboard at http://localhost:5173
npm run dev:website      # website at http://localhost:5174
```

### Emulators

```bash
npm run emulate
```

Set `VITE_USE_EMULATORS=true` in `packages/dashboard/.env.development` and `packages/website/.env.development`.

## Firebase project

- Project ID: `unidealz-prod` (configure in `.firebaserc`)
- Hosting sites: `unidealz-website`, `unidealz-dashboard`
- See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for console setup steps

## Deploy

```bash
npm run build:shared && npm run sync:functions && npm run build:functions
npm run deploy
```

## Data migration

See [scripts/migrate/README.md](./scripts/migrate/README.md).

## Cutover

See [CUTOVER.md](./CUTOVER.md) for production migration and DNS switch checklist.
