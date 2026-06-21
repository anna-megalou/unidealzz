import { COLLECTIONS } from './constants.js';
import { config } from './config.js';
import { getSupabase, getFirestore } from './utils/clients.js';
import { fetchAllRows, logStep, toIso, toIsoOrNull, writeBatch } from './utils/firestore.js';

const STEP = '06-operations-data';

export async function migrateOperationsData(): Promise<void> {
  const supabase = getSupabase();
  const db = getFirestore();

  const [supportTickets, teamInvites, activityLog, abAssignments, abEvents] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase.from('support_tickets').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('team_invites').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('activity_log').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('ab_assignments').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('ab_events').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
  ]);

  const items = [
    ...supportTickets.map((row) => ({
      collection: COLLECTIONS.supportTickets,
      id: row.id as string,
      data: {
        userId: row.user_id ?? null,
        fullName: row.full_name,
        studentEmail: row.student_email,
        subject: row.subject,
        message: row.message,
        status: row.status ?? 'open',
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...teamInvites.map((row) => ({
      collection: COLLECTIONS.teamInvites,
      id: row.id as string,
      data: {
        email: row.email,
        fullName: row.full_name ?? null,
        role: row.role,
        status: row.status ?? 'pending',
        invitedBy: row.invited_by ?? null,
        invitedAt: toIso(row.invited_at),
        acceptedAt: toIsoOrNull(row.accepted_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...activityLog.map((row) => ({
      collection: COLLECTIONS.activityLog,
      id: row.id as string,
      data: {
        actorId: row.actor_id ?? null,
        action: row.action,
        entity: row.entity ?? null,
        entityId: row.entity_id ?? null,
        summary: row.summary,
        metadata: row.metadata ?? {},
        createdAt: toIso(row.created_at),
      },
    })),
    ...abAssignments.map((row) => ({
      collection: COLLECTIONS.abAssignments,
      id: row.id as string,
      data: {
        experimentKey: row.experiment_key,
        variant: row.variant,
        userId: row.user_id ?? null,
        anonId: row.anon_id ?? null,
        createdAt: toIso(row.created_at),
      },
    })),
    ...abEvents.map((row) => ({
      collection: COLLECTIONS.abEvents,
      id: row.id as string,
      data: {
        experimentKey: row.experiment_key,
        variant: row.variant,
        eventType: row.event_type,
        userId: row.user_id ?? null,
        anonId: row.anon_id ?? null,
        metadata: row.metadata ?? {},
        createdAt: toIso(row.created_at),
      },
    })),
  ];

  if (config.dryRun) {
    logStep(STEP, 'Dry run — would write operations data', { count: items.length });
    return;
  }

  const written = await writeBatch(db, items, config.batchSize);
  logStep(STEP, 'Migrated operations data', {
    supportTickets: supportTickets.length,
    teamInvites: teamInvites.length,
    activityLog: activityLog.length,
    abAssignments: abAssignments.length,
    abEvents: abEvents.length,
    written,
  });
}

const isMain = process.argv[1]?.includes('06-operations-data');
if (isMain) {
  migrateOperationsData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
