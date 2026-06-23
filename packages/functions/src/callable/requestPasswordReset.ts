import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { CALLABLE_CONFIG } from '../config';
import { admin } from '../admin';
import { DASHBOARD_URL } from '../services/email/constants';
import { sendAuthEmailNow } from '../services/email/emailSender';
import { createAppPasswordResetUrl } from '../services/email/passwordResetLink';

interface RequestPasswordResetInput {
  email?: string;
}

function resolveAppOrigin(requestOrigin: string | undefined): string {
  const fallback = (process.env.DASHBOARD_URL ?? DASHBOARD_URL).replace(/\/$/, '');
  const fromRequest = requestOrigin?.trim();
  if (fromRequest && /^https?:\/\//.test(fromRequest)) {
    const origin = fromRequest.replace(/\/$/, '');
    // Firebase Auth only allows authorized domains in reset links — localhost is not valid.
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return fallback;
    }
    return origin;
  }
  return fallback;
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
