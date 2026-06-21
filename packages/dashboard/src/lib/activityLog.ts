import { callLogActivity } from '@/lib/firebase';

export async function logActivity(params: {
  action: string;
  summary: string;
  entity?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await callLogActivity({
      action: params.action,
      summary: params.summary,
      entity: params.entity,
      entityId: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // ignore — non-blocking
  }
}

export type ActivityRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
};
