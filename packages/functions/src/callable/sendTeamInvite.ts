import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { COLLECTIONS, STAFF_ROLES, type Role } from '@unidealz/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { CALLABLE_CONFIG } from '../config';
import { admin, db } from '../admin';
import { logActivity } from '../services/activity/activityCore';
import { sendAuthEmail } from '../services/email/emailSender';
import { SITE_URL } from '../services/email/constants';
import { requireAdmin } from '../utils/requireAdmin';

interface SendTeamInviteInput {
  email?: string;
  role?: string;
  fullName?: string;
}

export const sendTeamInvite = onCall(CALLABLE_CONFIG, async (request) => {
  const callerId = await requireAdmin(request);
  const data = (request.data ?? {}) as SendTeamInviteInput;

  const rawEmail = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const role = typeof data.role === 'string' ? data.role : '';
  const fullName =
    typeof data.fullName === 'string' ? data.fullName.trim().slice(0, 120) : '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(rawEmail) || rawEmail.length > 255) {
    throw new HttpsError('invalid-argument', 'Invalid email address');
  }
  if (!STAFF_ROLES.includes(role as Role)) {
    throw new HttpsError('invalid-argument', 'Invalid role');
  }

  const existingSnap = await db
    .collection(COLLECTIONS.teamInvites)
    .where('email', '==', rawEmail)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  let inviteId: string;
  let alreadyPending = false;

  if (!existingSnap.empty) {
    inviteId = existingSnap.docs[0].id;
    alreadyPending = true;
  } else {
    const ref = await db.collection(COLLECTIONS.teamInvites).add({
      email: rawEmail,
      role,
      status: 'pending',
      invitedBy: callerId,
      fullName: fullName || null,
      invitedAt: FieldValue.serverTimestamp(),
      acceptedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    inviteId = ref.id;
  }

  const acceptBase =
    request.rawRequest.headers.origin ??
    process.env.SITE_URL ??
    SITE_URL;
  const acceptUrl = `${acceptBase}/accept-invite?invite=${inviteId}`;

  let alreadyRegistered = false;
  try {
    await admin.auth().getUserByEmail(rawEmail);
    alreadyRegistered = true;
  } catch {
    alreadyRegistered = false;
  }

  try {
    const actionCodeSettings = {
      url: acceptUrl,
      handleCodeInApp: true,
    };

    const link = alreadyRegistered
      ? await admin.auth().generateSignInWithEmailLink(rawEmail, actionCodeSettings)
      : await admin.auth().generateSignInWithEmailLink(rawEmail, actionCodeSettings);

    await sendAuthEmail({
      type: alreadyRegistered ? 'magiclink' : 'invite',
      email: rawEmail,
      confirmationUrl: link,
      siteUrl: acceptBase,
    });
  } catch (err) {
    logger.error('sendTeamInvite email failed', { err, inviteId });
    throw new HttpsError(
      'internal',
      err instanceof Error ? err.message : 'Could not send invite email'
    );
  }

  try {
    await logActivity({
      actorId: callerId,
      action: 'team.invite_sent',
      summary: `Invited ${rawEmail} as ${role}`,
      entity: 'team_invite',
      entityId: inviteId,
      metadata: { email: rawEmail, role },
    });
  } catch {
    // Best effort
  }

  return {
    success: true,
    already_pending: alreadyPending,
    already_registered: alreadyRegistered,
    invite_id: inviteId,
  };
});
