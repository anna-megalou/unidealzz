import { admin } from '../../admin';

export function toAppPasswordResetUrl(firebaseLink: string, appOrigin: string): string {
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

export async function createAppPasswordResetUrl(
  email: string,
  appOrigin: string,
): Promise<string> {
  const firebaseLink = await admin.auth().generatePasswordResetLink(email, {
    url: `${appOrigin.replace(/\/$/, '')}/reset-password`,
    handleCodeInApp: true,
  });

  return toAppPasswordResetUrl(firebaseLink, appOrigin);
}
