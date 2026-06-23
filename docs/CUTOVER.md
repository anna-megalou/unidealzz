# Production Cutover Checklist

Use this checklist when migrating from Supabase/Lovable to Firebase.

## Pre-cutover

- [ ] Firebase project created with Blaze plan
- [ ] Auth (email/password), Firestore, Storage, Functions, Hosting (2 sites), App Check enabled
- [ ] Custom domains configured: `unidealz.gr` (website), `app.unidealz.gr` (dashboard)
- [ ] Resend API key and domain DNS verified for `unidealz.gr` / `notify.unidealz.gr`
- [ ] OpenAI API key set in Functions secrets
- [ ] Staging dry run completed with migration scripts against emulators or staging project
- [ ] All CI checks passing (`npm run build`, tests)

## Cutover day

1. **Freeze writes** on Lovable/Supabase (maintenance mode)
2. **Export final snapshot** from Supabase
3. **Run migration pipeline** (one-time, now completed; the `scripts/migrate` tooling has since been removed)
4. **Deploy Firebase**:
   ```bash
   npm run build:shared && npm run sync:functions && npm run build:functions
   npm run deploy
   ```
5. **Switch DNS** to Firebase Hosting for both domains
6. **Send password reset emails** to users (Supabase password hashes cannot be imported)
7. **Monitor** Auth logs, Functions logs, email delivery, error reporting

## Rollback (first 2 weeks)

- Keep Supabase project read-only as rollback buffer
- DNS can be reverted to Lovable if critical issues arise
- Document any data written to Firebase during cutover window for reconciliation

## Post-cutover

- [ ] Verify login, signup, offers browse, save/claim, operations CRUD, experiences, chat assistant
- [ ] Confirm transactional and auth emails deliver correctly
- [ ] Decommission Supabase after 2-week stability period
