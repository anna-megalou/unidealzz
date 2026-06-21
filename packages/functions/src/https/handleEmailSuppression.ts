import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { createHmac, timingSafeEqual } from 'crypto';
import { COLLECTIONS } from '@unidealz/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { HTTPS_CONFIG } from '../config';
import { db } from '../admin';

interface SuppressionPayload {
  email: string;
  reason: 'bounce' | 'complaint' | 'unsubscribe';
  message_id?: string;
  metadata?: Record<string, unknown>;
}

interface ResendWebhookEvent {
  type: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    bounce?: { message?: string };
    complaint?: { message?: string };
  };
}

function verifyResendWebhook(
  rawBody: Buffer,
  headers: Record<string, string | string[] | undefined>,
  secret: string
): boolean {
  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  if (
    typeof svixId !== 'string' ||
    typeof svixTimestamp !== 'string' ||
    typeof svixSignature !== 'string'
  ) {
    return false;
  }

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody.toString('utf8')}`;
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  const signatures = svixSignature.split(' ');
  return signatures.some((sig) => {
    const value = sig.split(',')[1];
    if (!value) return false;
    try {
      return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

function mapResendEvent(event: ResendWebhookEvent): SuppressionPayload | null {
  const email = event.data?.to?.[0];
  if (!email) return null;

  switch (event.type) {
    case 'email.bounced':
      return {
        email,
        reason: 'bounce',
        message_id: event.data?.email_id,
        metadata: { bounce: event.data?.bounce },
      };
    case 'email.complained':
      return {
        email,
        reason: 'complaint',
        message_id: event.data?.email_id,
        metadata: { complaint: event.data?.complaint },
      };
    default:
      return null;
  }
}

function mapReasonToStatus(reason: string): string {
  switch (reason) {
    case 'bounce':
      return 'bounced';
    case 'complaint':
      return 'complained';
    default:
      return 'suppressed';
  }
}

function mapReasonToMessage(reason: string): string {
  switch (reason) {
    case 'bounce':
      return 'Permanent bounce — email address is invalid or rejected';
    case 'complaint':
      return 'Spam complaint — recipient marked email as spam';
    case 'unsubscribe':
      return 'Recipient unsubscribed';
    default:
      return 'Email suppressed';
  }
}

export const handleEmailSuppression = onRequest(HTTPS_CONFIG, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  const rawBody = req.rawBody;
  if (!rawBody || !verifyResendWebhook(rawBody, req.headers, secret)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody.toString('utf8')) as ResendWebhookEvent;
  } catch {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const payload = mapResendEvent(event);
  if (!payload) {
    res.status(200).json({ success: true, ignored: true });
    return;
  }

  const normalizedEmail = payload.email.toLowerCase();

  await db.collection(COLLECTIONS.suppressedEmails).doc(normalizedEmail).set(
    {
      email: normalizedEmail,
      reason: payload.reason,
      metadata: payload.metadata ?? null,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  try {
    await db.collection(COLLECTIONS.emailSendLog).add({
      messageId: payload.message_id ?? null,
      templateName: 'system',
      recipientEmail: normalizedEmail,
      status: mapReasonToStatus(payload.reason),
      errorMessage: mapReasonToMessage(payload.reason),
      metadata: payload.metadata ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logger.warn('Failed to insert email_send_log for suppression', { err });
  }

  logger.info('Suppression processed', {
    reason: payload.reason,
    email: normalizedEmail[0] + '***',
  });

  res.status(200).json({ success: true });
});
