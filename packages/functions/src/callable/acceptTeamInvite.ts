import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { COLLECTIONS, type Role } from '@unidealz/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { CALLABLE_CONFIG } from '../config';
import { admin, db } from '../admin';
import { assignRole } from '../services/role/roleCore';

export const acceptTeamInvite = onCall(CALLABLE_CONFIG, async (request) => {
  if (!request.auth) {
    return { success: true, no_session: true };
  }

  const email = request.auth.token.email?.toLowerCase();
  if (!email) {
    return { success: true, no_session: true };
  }

  const uid = request.auth.uid;

  try {
    const inviteSnap = await db
      .collection(COLLECTIONS.teamInvites)
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .orderBy('invitedAt', 'desc')
      .limit(1)
      .get();

    if (inviteSnap.empty) {
      return { success: true, no_invite: true };
    }

    const inviteDoc = inviteSnap.docs[0];
    const invite = inviteDoc.data();
    const role = invite.role as Role;

    await assignRole(uid, role);

    await inviteDoc.ref.update({
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info('Team invite accepted', { uid, role, inviteId: inviteDoc.id });
    return { success: true, role };
  } catch (err) {
    logger.error('acceptTeamInvite failed', { err });
    throw new HttpsError(
      'internal',
      err instanceof Error ? err.message : 'Unexpected error'
    );
  }
});
