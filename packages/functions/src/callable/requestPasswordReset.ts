import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { CALLABLE_CONFIG } from '../config';
import { admin } from '../admin';
import { SITE_URL } from '../services/email/constants';
import { sendAuthEmailNow } from '../services/email/emailSender';
import { createAppPasswordResetUrl } from '../services/email/passwordResetLink';

interface RequestPasswordResetInput {
  email?: string;
}

function resolveAppOrigin(requestOrigin: string | undefined): string {
  const fromRequest = requestOrigin?.trim();
  if (fromRequest && /^https?:\/\//.test(fromRequest)) {
    return fromRequest.replace(/\/$/, '');
  }
  return (process.env.SITE_URL ?? SITE_URL).replace(/\/$/, '');
}

export const requestPasswordReset = onCall(CALLABLE_CONFIG, async (request) => {
  const data = (request.data ?? {}) as RequestPasswordResetInput;
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) {
    throw new HttpsError('invalid-argument', 'Invalid email address');
  }

  const appOrigin = resolveAppOrigin(request.rawRequest.headers.origin);

  try {
    await admin.auth().getUserByEmail(email);
  } catch {
    // Do not reveal whether the account exists.
    return { success: true };
  }

  try {
    const resetUrl = await createAppPasswordResetUrl(email, appOrigin);
    await sendAuthEmailNow({
      type: 'recovery',
      email,
      confirmationUrl: resetUrl,
      siteUrl: appOrigin,
    });
  } catch (err) {
    logger.error('requestPasswordReset failed', { err, email: email.replace(/(.{2}).+(@.*)/, '$1***$2') });
    throw new HttpsError(
      'internal',
      err instanceof Error ? err.message : 'Could not send password reset email',
    );
  }

  return { success: true };
});
