import * as React from 'react';
import { createElement } from 'react';
import { renderAsync } from '@react-email/components';
import { COLLECTIONS } from '@unidealz/shared';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { Resend } from 'resend';
import { randomBytes, randomUUID } from 'crypto';
import { db } from '../../admin';
import {
  AUTH_EMAIL_SUBJECTS,
  AUTH_QUEUE,
  DEFAULT_AUTH_TTL_MINUTES,
  DEFAULT_BATCH_SIZE,
  DEFAULT_SEND_DELAY_MS,
  DEFAULT_TRANSACTIONAL_TTL_MINUTES,
  FROM_EMAIL,
  MAX_EMAIL_RETRIES,
  SITE_NAME,
  SITE_URL,
  TRANSACTIONAL_QUEUE,
} from './constants';
import { EmailChangeEmail } from './templates/auth/emailChange';
import { InviteEmail } from './templates/auth/invite';
import { MagicLinkEmail } from './templates/auth/magicLink';
import { RecoveryEmail } from './templates/auth/recovery';
import { ReauthenticationEmail } from './templates/auth/reauthentication';
import { SignupEmail } from './templates/auth/signup';
import { TEMPLATES } from './templates/transactional/registry';
import type {
  AuthEmailType,
  EmailQueueName,
  EmailQueuePayload,
  SendAuthEmailInput,
  SendTransactionalEmailInput,
  SendTransactionalEmailResult,
  TemplateEntry,
} from './types';

const AUTH_TEMPLATES: Record<AuthEmailType, React.ComponentType<Record<string, unknown>>> = {
  signup: SignupEmail as unknown as React.ComponentType<Record<string, unknown>>,
  invite: InviteEmail as unknown as React.ComponentType<Record<string, unknown>>,
  magiclink: MagicLinkEmail as unknown as React.ComponentType<Record<string, unknown>>,
  recovery: RecoveryEmail as unknown as React.ComponentType<Record<string, unknown>>,
  email_change: EmailChangeEmail as unknown as React.ComponentType<Record<string, unknown>>,
  reauthentication: ReauthenticationEmail as unknown as React.ComponentType<Record<string, unknown>>,
};

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

async function renderTemplate(
  entry: TemplateEntry,
  data: Record<string, unknown>
): Promise<{ html: string; text: string; subject: string }> {
  const element = createElement(entry.component, data);
  const html = await renderAsync(element);
  const text = await renderAsync(element, { plainText: true });
  const subject =
    typeof entry.subject === 'function' ? entry.subject(data) : entry.subject;
  return { html, text, subject };
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const normalized = email.toLowerCase();
  const snap = await db
    .collection(COLLECTIONS.suppressedEmails)
    .where('email', '==', normalized)
    .limit(1)
    .get();
  return !snap.empty;
}

async function logEmailSend(params: {
  messageId: string;
  templateName: string;
  recipientEmail: string;
  status: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.collection(COLLECTIONS.emailSendLog).add({
    messageId: params.messageId,
    templateName: params.templateName,
    recipientEmail: params.recipientEmail,
    status: params.status,
    errorMessage: params.errorMessage ?? null,
    metadata: params.metadata ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getOrCreateUnsubscribeToken(email: string): Promise<string> {
  const normalized = email.toLowerCase();
  const snap = await db
    .collection(COLLECTIONS.emailUnsubscribeTokens)
    .where('email', '==', normalized)
    .limit(1)
    .get();

  if (!snap.empty) {
    const data = snap.docs[0].data();
    if (!data.usedAt) {
      return data.token as string;
    }
    throw new Error('Email already unsubscribed');
  }

  const token = generateToken();
  await db.collection(COLLECTIONS.emailUnsubscribeTokens).add({
    email: normalized,
    token,
    usedAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return token;
}

export async function enqueueEmail(
  queueName: EmailQueueName,
  payload: EmailQueuePayload
): Promise<void> {
  await db.collection(COLLECTIONS.emailQueue).add({
    queueName,
    status: 'pending',
    payload,
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
    visibleUntil: Timestamp.now(),
  });
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<SendTransactionalEmailResult> {
  const template = TEMPLATES[input.templateName];
  if (!template) {
    throw new Error(`Template '${input.templateName}' not found`);
  }

  const effectiveRecipient = template.to ?? input.recipientEmail;
  if (!effectiveRecipient) {
    throw new Error('recipientEmail is required');
  }

  const messageId = randomUUID();
  const idempotencyKey = input.idempotencyKey ?? messageId;
  const templateData = input.templateData ?? {};

  if (await isEmailSuppressed(effectiveRecipient)) {
    await logEmailSend({
      messageId,
      templateName: input.templateName,
      recipientEmail: effectiveRecipient,
      status: 'suppressed',
    });
    return { success: false, reason: 'email_suppressed' };
  }

  let unsubscribeToken: string;
  try {
    unsubscribeToken = await getOrCreateUnsubscribeToken(effectiveRecipient);
  } catch {
    await logEmailSend({
      messageId,
      templateName: input.templateName,
      recipientEmail: effectiveRecipient,
      status: 'suppressed',
      errorMessage: 'Unsubscribe token used',
    });
    return { success: false, reason: 'email_suppressed' };
  }

  const { html, text, subject } = await renderTemplate(template, templateData);

  await logEmailSend({
    messageId,
    templateName: input.templateName,
    recipientEmail: effectiveRecipient,
    status: 'pending',
  });

  await enqueueEmail(TRANSACTIONAL_QUEUE, {
    messageId,
    to: effectiveRecipient,
    from: FROM_EMAIL,
    subject,
    html,
    text,
    purpose: 'transactional',
    label: input.templateName,
    idempotencyKey,
    unsubscribeToken,
    queuedAt: new Date().toISOString(),
  });

  return { success: true, queued: true };
}

export async function sendAuthEmail(input: SendAuthEmailInput): Promise<void> {
  const { messageId, payload } = await buildAuthEmailPayload(input);

  await logEmailSend({
    messageId,
    templateName: input.type,
    recipientEmail: input.email,
    status: 'pending',
  });

  await enqueueEmail(AUTH_QUEUE, payload);
}

/** Sends an auth email immediately via Resend (for time-sensitive flows like password reset). */
export async function sendAuthEmailNow(input: SendAuthEmailInput): Promise<void> {
  const { messageId, payload } = await buildAuthEmailPayload(input);

  await logEmailSend({
    messageId,
    templateName: input.type,
    recipientEmail: input.email,
    status: 'pending',
  });

  try {
    await sendViaResend(payload);
    await logEmailSend({
      messageId,
      templateName: input.type,
      recipientEmail: input.email,
      status: 'sent',
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logEmailSend({
      messageId,
      templateName: input.type,
      recipientEmail: input.email,
      status: 'failed',
      errorMessage: errorMsg.slice(0, 1000),
    });
    throw error;
  }
}

async function buildAuthEmailPayload(input: SendAuthEmailInput): Promise<{
  messageId: string;
  payload: EmailQueuePayload;
}> {
  const Template = AUTH_TEMPLATES[input.type];
  if (!Template) {
    throw new Error(`Unknown auth email type: ${input.type}`);
  }

  const templateProps: Record<string, unknown> = {
    siteName: SITE_NAME,
    siteUrl: input.siteUrl ?? SITE_URL,
    recipient: input.email,
    confirmationUrl: input.confirmationUrl ?? SITE_URL,
    token: input.token,
    email: input.email,
    newEmail: input.newEmail,
  };

  const element = createElement(Template, templateProps);
  const html = await renderAsync(element);
  const text = await renderAsync(element, { plainText: true });
  const subject = AUTH_EMAIL_SUBJECTS[input.type] ?? 'Notification';
  const messageId = randomUUID();

  return {
    messageId,
    payload: {
      messageId,
      to: input.email,
      from: FROM_EMAIL,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: input.type,
      queuedAt: new Date().toISOString(),
    },
  };
}

export async function sendViaResend(payload: EmailQueuePayload): Promise<void> {
  const resend = getResendClient();
  const headers: Record<string, string> = {};
  if (payload.unsubscribeToken) {
    const baseUrl = process.env.UNSUBSCRIBE_BASE_URL ?? `${SITE_URL}/api/email/unsubscribe`;
    headers['List-Unsubscribe'] = `<${baseUrl}?token=${payload.unsubscribeToken}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  const { error } = await resend.emails.send({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    headers,
  });

  if (error) {
    throw new Error(error.message);
  }
}

interface QueueState {
  batchSize: number;
  sendDelayMs: number;
  authEmailTtlMinutes: number;
  transactionalEmailTtlMinutes: number;
  retryAfterUntil: Date | null;
}

async function getQueueState(): Promise<QueueState> {
  const doc = await db.collection(COLLECTIONS.emailSendState).doc('default').get();
  const data = doc.data();
  return {
    batchSize: data?.batchSize ?? DEFAULT_BATCH_SIZE,
    sendDelayMs: data?.sendDelayMs ?? DEFAULT_SEND_DELAY_MS,
    authEmailTtlMinutes: data?.authEmailTtlMinutes ?? DEFAULT_AUTH_TTL_MINUTES,
    transactionalEmailTtlMinutes:
      data?.transactionalEmailTtlMinutes ?? DEFAULT_TRANSACTIONAL_TTL_MINUTES,
    retryAfterUntil: data?.retryAfterUntil?.toDate?.() ?? null,
  };
}

async function countFailedAttempts(messageId: string): Promise<number> {
  const snap = await db
    .collection(COLLECTIONS.emailSendLog)
    .where('messageId', '==', messageId)
    .where('status', '==', 'failed')
    .get();
  return snap.size;
}

async function wasAlreadySent(messageId: string): Promise<boolean> {
  const snap = await db
    .collection(COLLECTIONS.emailSendLog)
    .where('messageId', '==', messageId)
    .where('status', '==', 'sent')
    .limit(1)
    .get();
  return !snap.empty;
}

export async function processEmailQueue(): Promise<{
  processed: number;
  stopped?: string;
  skipped?: boolean;
  reason?: string;
}> {
  const state = await getQueueState();
  if (state.retryAfterUntil && state.retryAfterUntil > new Date()) {
    return { processed: 0, skipped: true, reason: 'rate_limited' };
  }

  let totalProcessed = 0;
  const queues: EmailQueueName[] = [AUTH_QUEUE, TRANSACTIONAL_QUEUE];

  for (const queueName of queues) {
    const ttlMinutes =
      queueName === AUTH_QUEUE
        ? state.authEmailTtlMinutes
        : state.transactionalEmailTtlMinutes;

    const pending = await db
      .collection(COLLECTIONS.emailQueue)
      .where('queueName', '==', queueName)
      .where('status', '==', 'pending')
      .where('visibleUntil', '<=', Timestamp.now())
      .orderBy('visibleUntil')
      .orderBy('createdAt')
      .limit(state.batchSize)
      .get();

    for (let i = 0; i < pending.docs.length; i++) {
      const doc = pending.docs[i];
      const data = doc.data();
      const payload = data.payload as EmailQueuePayload;
      const failedAttempts = await countFailedAttempts(payload.messageId);

      const queuedAt = payload.queuedAt ?? data.createdAt?.toDate?.()?.toISOString();
      if (queuedAt) {
        const ageMs = Date.now() - new Date(queuedAt).getTime();
        if (ageMs > ttlMinutes * 60 * 1000) {
          await doc.ref.update({ status: 'dlq', updatedAt: FieldValue.serverTimestamp() });
          await logEmailSend({
            messageId: payload.messageId,
            templateName: payload.label,
            recipientEmail: payload.to,
            status: 'dlq',
            errorMessage: `TTL exceeded (${ttlMinutes} minutes)`,
          });
          continue;
        }
      }

      if (failedAttempts >= MAX_EMAIL_RETRIES) {
        await doc.ref.update({ status: 'dlq', updatedAt: FieldValue.serverTimestamp() });
        await logEmailSend({
          messageId: payload.messageId,
          templateName: payload.label,
          recipientEmail: payload.to,
          status: 'dlq',
          errorMessage: `Max retries (${MAX_EMAIL_RETRIES}) exceeded`,
        });
        continue;
      }

      if (await wasAlreadySent(payload.messageId)) {
        await doc.ref.delete();
        continue;
      }

      await doc.ref.update({ status: 'processing' });

      try {
        await sendViaResend(payload);
        await logEmailSend({
          messageId: payload.messageId,
          templateName: payload.label,
          recipientEmail: payload.to,
          status: 'sent',
        });
        await doc.ref.delete();
        totalProcessed++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Email send failed', { queueName, error: errorMsg });

        const isRateLimited = errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate');
        await logEmailSend({
          messageId: payload.messageId,
          templateName: payload.label,
          recipientEmail: payload.to,
          status: isRateLimited ? 'rate_limited' : 'failed',
          errorMessage: errorMsg.slice(0, 1000),
        });

        if (isRateLimited) {
          await db.collection(COLLECTIONS.emailSendState).doc('default').set(
            {
              retryAfterUntil: Timestamp.fromDate(new Date(Date.now() + 60_000)),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          await doc.ref.update({
            status: 'pending',
            visibleUntil: Timestamp.fromDate(new Date(Date.now() + 60_000)),
            attempts: FieldValue.increment(1),
          });
          return { processed: totalProcessed, stopped: 'rate_limited' };
        }

        await doc.ref.update({
          status: 'pending',
          visibleUntil: Timestamp.fromDate(new Date(Date.now() + 30_000)),
          attempts: FieldValue.increment(1),
        });
      }

      if (i < pending.docs.length - 1 && state.sendDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, state.sendDelayMs));
      }
    }
  }

  return { processed: totalProcessed };
}

export async function previewAllTemplates(): Promise<
  Array<{
    templateName: string;
    displayName: string;
    subject: string;
    html: string;
    status: 'ready' | 'preview_data_required' | 'render_failed';
    errorMessage?: string;
  }>
> {
  const results = [];
  for (const [name, entry] of Object.entries(TEMPLATES)) {
    const displayName = entry.displayName ?? name;
    if (!entry.previewData) {
      results.push({
        templateName: name,
        displayName,
        subject: '',
        html: '',
        status: 'preview_data_required' as const,
      });
      continue;
    }
    try {
      const { html, subject } = await renderTemplate(entry, entry.previewData);
      results.push({
        templateName: name,
        displayName,
        subject,
        html,
        status: 'ready' as const,
      });
    } catch (err) {
      results.push({
        templateName: name,
        displayName,
        subject: '',
        html: '',
        status: 'render_failed' as const,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}
