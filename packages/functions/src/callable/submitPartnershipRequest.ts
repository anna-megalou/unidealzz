import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { PartnershipRequestSchema, COLLECTIONS } from '@unidealz/shared';
import { CALLABLE_CONFIG } from '../config/functionConfig';
import { db } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export const submitPartnershipRequest = onCall(CALLABLE_CONFIG, async (request) => {
  const parsed = PartnershipRequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  try {
    await db.collection(COLLECTIONS.partnershipRequests).add({
      brandName: parsed.data.brandName,
      email: parsed.data.email,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    logger.error('submitPartnershipRequest failed', error);
    throw new HttpsError('internal', 'Failed to submit partnership request');
  }
});
