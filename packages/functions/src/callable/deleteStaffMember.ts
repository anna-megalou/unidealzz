import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { COLLECTIONS } from '@unidealz/shared';
import { CALLABLE_CONFIG } from '../config';
import { admin, db } from '../admin';
import { logActivity } from '../services/activity/activityCore';
import { removeAllRoles } from '../services/role/roleCore';
import { requireAdmin } from '../utils/requireAdmin';

interface DeleteStaffMemberInput {
  userId?: string;
  deleteAuthUser?: boolean;
}

export const deleteStaffMember = onCall(CALLABLE_CONFIG, async (request) => {
  const callerId = await requireAdmin(request);
  const data = (request.data ?? {}) as DeleteStaffMemberInput;
  const targetUserId = typeof data.userId === 'string' ? data.userId : '';

  if (!targetUserId) {
    throw new HttpsError('invalid-argument', 'Missing userId');
  }
  if (targetUserId === callerId) {
    throw new HttpsError('invalid-argument', 'You cannot remove yourself');
  }

  let targetEmail: string | null = null;
  try {
    const target = await admin.auth().getUser(targetUserId);
    targetEmail = target.email ?? null;
  } catch {
    // Non-fatal
  }

  await removeAllRoles(targetUserId);

  if (targetEmail) {
    const invites = await db
      .collection(COLLECTIONS.teamInvites)
      .where('email', '==', targetEmail.toLowerCase())
      .get();
    const batch = db.batch();
    invites.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  if (data.deleteAuthUser) {
    try {
      await admin.auth().deleteUser(targetUserId);
    } catch (err) {
      logger.warn('deleteUser failed', { targetUserId, err });
    }
  }

  try {
    await logActivity({
      actorId: callerId,
      action: 'team.member_removed',
      summary: `Removed ${targetEmail ?? targetUserId} from staff`,
      entity: 'user',
      entityId: targetUserId,
      metadata: { email: targetEmail, deletedAuthUser: Boolean(data.deleteAuthUser) },
    });
  } catch {
    // Best effort
  }

  return { success: true };
});
