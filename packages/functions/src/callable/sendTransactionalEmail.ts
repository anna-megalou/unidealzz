import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { CALLABLE_CONFIG } from '../config';
import { sendTransactionalEmail as enqueueTransactionalEmail } from '../services/email/emailSender';
import type { SendTransactionalEmailInput } from '../services/email/types';

export const sendTransactionalEmail = onCall(CALLABLE_CONFIG, async (request) => {
  const data = (request.data ?? {}) as SendTransactionalEmailInput & {
    template_name?: string;
    recipient_email?: string;
    idempotency_key?: string;
    templateData?: Record<string, unknown>;
    template_data?: Record<string, unknown>;
  };

  const templateName = data.templateName ?? data.template_name;
  const recipientEmail = data.recipientEmail ?? data.recipient_email;
  const idempotencyKey = data.idempotencyKey ?? data.idempotency_key;
  const templateData = data.templateData ?? data.template_data ?? {};

  if (!templateName) {
    throw new HttpsError('invalid-argument', 'templateName is required');
  }

  try {
    const result = await enqueueTransactionalEmail({
      templateName,
      recipientEmail,
      idempotencyKey,
      templateData,
    });
    return result;
  } catch (err) {
    logger.error('sendTransactionalEmail failed', { err, templateName });
    const message = err instanceof Error ? err.message : 'Failed to enqueue email';
    if (message.includes('not found')) {
      throw new HttpsError('not-found', message);
    }
    throw new HttpsError('internal', message);
  }
});
