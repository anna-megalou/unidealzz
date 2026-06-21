import { COLLECTIONS, type Json } from '@unidealz/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../admin';

export interface LogActivityInput {
  actorId: string;
  action: string;
  summary: string;
  entity?: string | null;
  entityId?: string | null;
  metadata?: Json;
}

/** Internal activity log writer (replaces Supabase log_activity RPC). */
export async function logActivity(input: LogActivityInput): Promise<string> {
  const ref = await db.collection(COLLECTIONS.activityLog).add({
    actorId: input.actorId,
    action: input.action,
    summary: input.summary,
    entity: input.entity ?? null,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
