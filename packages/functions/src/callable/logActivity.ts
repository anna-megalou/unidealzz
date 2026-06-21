import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { Json } from '@unidealz/shared';
import { CALLABLE_CONFIG } from '../config';
import { logActivity as writeActivity } from '../services/activity/activityCore';

export const logActivity = onCall(CALLABLE_CONFIG, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const { action, summary, entity, entityId, metadata } = request.data as {
    action: string;
    summary: string;
    entity?: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  };

  if (!action || !summary) {
    throw new HttpsError('invalid-argument', 'action and summary required');
  }

  await writeActivity({
    actorId: request.auth.uid,
    action,
    summary,
    entity,
    entityId: entityId ?? null,
    metadata: (metadata ?? {}) as Json,
  });

  return { success: true };
});
