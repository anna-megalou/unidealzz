import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget admin activity logger.
 * Silently no-ops on failure (e.g. non-admin caller) so it never blocks UX.
 */
export async function logActivity(params: {
  action: string;
  summary: string;
  entity?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await (supabase as any).rpc("log_activity", {
      _action: params.action,
      _summary: params.summary,
      _entity: params.entity ?? null,
      _entity_id: params.entityId ?? null,
      _metadata: params.metadata ?? {},
    });
  } catch {
    // ignore
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
