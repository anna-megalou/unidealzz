import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { COLLECTIONS } from '@unidealz/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { HTTPS_CONFIG } from '../config';
import { db } from '../admin';

export const handleEmailUnsubscribe = onRequest(HTTPS_CONFIG, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'authorization, content-type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let token: string | null =
    typeof req.query.token === 'string' ? req.query.token : null;

  if (req.method === 'POST') {
    const contentType = req.headers['content-type'] ?? '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formToken = req.body?.token;
      if (!req.body?.['List-Unsubscribe'] && typeof formToken === 'string') {
        token = formToken;
      }
    } else if (typeof req.body?.token === 'string') {
      token = req.body.token;
    }
  }

  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  const tokenSnap = await db
    .collection(COLLECTIONS.emailUnsubscribeTokens)
    .where('token', '==', token)
    .limit(1)
    .get();

  if (tokenSnap.empty) {
    res.status(404).json({ error: 'Invalid or expired token' });
    return;
  }

  const tokenDoc = tokenSnap.docs[0];
  const tokenRecord = tokenDoc.data();

  if (tokenRecord.usedAt) {
    res.status(200).json({ valid: false, reason: 'already_unsubscribed' });
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({ valid: true });
    return;
  }

  const updated = await db.runTransaction(async (tx) => {
    const fresh = await tx.get(tokenDoc.ref);
    if (fresh.data()?.usedAt) {
      return false;
    }
    tx.update(tokenDoc.ref, { usedAt: FieldValue.serverTimestamp() });
    return true;
  });

  if (!updated) {
    res.status(200).json({ success: false, reason: 'already_unsubscribed' });
    return;
  }

  const email = (tokenRecord.email as string).toLowerCase();
  await db.collection(COLLECTIONS.suppressedEmails).doc(email).set(
    {
      email,
      reason: 'unsubscribe',
      metadata: null,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  logger.info('Email unsubscribed', { email: email[0] + '***' });
  res.status(200).json({ success: true });
});
