import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { logger } from 'firebase-functions/v2';
import { COLLECTIONS } from '@unidealz/shared';
import { admin, db } from '../admin';
import { sendAuthEmail } from '../services/email/emailSender';
import { SITE_URL } from '../services/email/constants';

/**
 * Sets default student role on signup and sends custom auth emails via Resend.
 * Configure Firebase Auth to use custom email action URLs pointing to your app;
 * verification/reset links are generated here when users are created.
 */
export const onAuthEmail = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) return {};
  const email = user.email?.toLowerCase();

  if (!email) {
    return {};
  }

  const pendingInvite = await db
    .collection(COLLECTIONS.teamInvites)
    .where('email', '==', email)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!pendingInvite.empty) {
    const invite = pendingInvite.docs[0].data();
    return {
      customClaims: {
        roles: [invite.role],
        invitedStaff: true,
      },
    };
  }

  return {
    customClaims: {
      roles: ['student'],
    },
  };
});

/** Send verification email for a newly created user (call from client after signup). */
export async function sendSignupVerificationEmail(
  email: string,
  continueUrl?: string
): Promise<void> {
  const link = await admin.auth().generateEmailVerificationLink(email, {
    url: continueUrl ?? SITE_URL,
    handleCodeInApp: true,
  });

  await sendAuthEmail({
    type: 'signup',
    email,
    confirmationUrl: link,
    siteUrl: continueUrl ?? SITE_URL,
  });

  logger.info('Signup verification email enqueued', { email: email[0] + '***' });
}
