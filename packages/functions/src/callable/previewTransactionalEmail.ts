import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { CALLABLE_CONFIG } from '../config';
import { previewAllTemplates } from '../services/email/emailSender';

export const previewTransactionalEmail = onCall(CALLABLE_CONFIG, async (request) => {
  const apiKey = process.env.EMAIL_PREVIEW_API_KEY;
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Preview is not configured');
  }

  const authHeader = request.rawRequest.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (token !== apiKey) {
    throw new HttpsError('permission-denied', 'Unauthorized');
  }

  const templates = await previewAllTemplates();
  return { templates };
});
