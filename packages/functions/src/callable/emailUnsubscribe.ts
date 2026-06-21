import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { COLLECTIONS } from '@unidealz/shared';
import { CALLABLE_CONFIG } from '../config/functionConfig';
import { db } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

async function findTokenDoc(token: string) {
  const snap = await db
    .collection(COLLECTIONS.emailUnsubscribeTokens)
    .where('token', '==', token)
    .limit(1)
    .get();
  return snap.docs[0] ?? null;
}

export const validateEmailUnsubscribe = onCall(CALLABLE_CONFIG, async (request) => {
  const token = String((request.data as { token?: string })?.token ?? '').trim();
  if (!token) {
    return { valid: false, reason: 'invalid_token' as const };
  }

  try {
    const doc = await findTokenDoc(token);
    if (!doc) return { valid: false, reason: 'invalid_token' as const };
    if (doc.data().usedAt) return { valid: false, reason: 'already_unsubscribed' as const };
    return { valid: true };
  } catch (error) {
    logger.error('validateEmailUnsubscribe failed', error);
    throw new HttpsError('internal', 'Failed to validate unsubscribe link');
  }
});

export const confirmEmailUnsubscribe = onCall(CALLABLE_CONFIG, async (request) => {
  const token = String((request.data as { token?: string })?.token ?? '').trim();
  if (!token) {
    throw new HttpsError('invalid-argument', 'Token is required');
  }

  try {
    const doc = await findTokenDoc(token);
    if (!doc) {
      throw new HttpsError('not-found', 'Invalid unsubscribe link');
    }

    const data = doc.data();
    if (data.usedAt) {
      return { success: true, reason: 'already_unsubscribed' as const };
    }

    const email = String(data.email ?? '').trim().toLowerCase();
    await Promise.all([
      doc.ref.update({ usedAt: FieldValue.serverTimestamp() }),
      email
        ? db.collection(COLLECTIONS.suppressedEmails).doc(email).set({
            email,
            reason: 'unsubscribe',
            createdAt: FieldValue.serverTimestamp(),
          })
        : Promise.resolve(),
    ]);

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('confirmEmailUnsubscribe failed', error);
    throw new HttpsError('internal', 'Failed to process unsubscribe');
  }
});
