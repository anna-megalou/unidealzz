import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { configureFirebaseCredentials, assertFirebaseProjectId } from './config.js';
import { logStep } from './utils/firestore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STEP = 'send-password-reset';

function toAppPasswordResetUrl(firebaseLink: string, appOrigin: string): string {
  const parsed = new URL(firebaseLink);
  const oobCode = parsed.searchParams.get('oobCode');
  if (!oobCode) {
    throw new Error('Firebase password reset link is missing oobCode');
  }

  const appUrl = new URL('/reset-password', appOrigin.replace(/\/$/, ''));
  appUrl.searchParams.set('oobCode', oobCode);
  appUrl.searchParams.set('mode', 'resetPassword');
  return appUrl.toString();
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run send:password-reset -- user@example.com');
    process.exit(1);
  }

  const appOrigin = process.env.APP_ORIGIN ?? 'http://localhost:3002';

  configureFirebaseCredentials();
  if (!getApps().length) {
    initializeApp({ projectId: assertFirebaseProjectId() });
  }

  const auth = getAuth();
  await auth.getUserByEmail(email);

  const firebaseLink = await auth.generatePasswordResetLink(email, {
    url: `${appOrigin.replace(/\/$/, '')}/reset-password`,
    handleCodeInApp: true,
  });
  const appLink = toAppPasswordResetUrl(firebaseLink, appOrigin);

  logStep(STEP, 'Password reset link generated (valid ~1 hour, single use)', {
    email,
    appLink,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
