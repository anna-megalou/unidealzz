import { COLLECTIONS } from './constants.js';
import { getSupabase, getFirestore } from './utils/clients.js';

interface CountPair {
  name: string;
  supabaseTable: string;
  firestoreCollection: string;
}

const COUNT_PAIRS: CountPair[] = [
  { name: 'categories', supabaseTable: 'categories', firestoreCollection: COLLECTIONS.categories },
  { name: 'universities', supabaseTable: 'universities', firestoreCollection: COLLECTIONS.universities },
  { name: 'brands', supabaseTable: 'brands', firestoreCollection: COLLECTIONS.brands },
  { name: 'offers', supabaseTable: 'offers', firestoreCollection: COLLECTIONS.offers },
  { name: 'profiles', supabaseTable: 'profiles', firestoreCollection: COLLECTIONS.profiles },
  { name: 'student_profiles', supabaseTable: 'student_profiles', firestoreCollection: COLLECTIONS.studentProfiles },
  { name: 'favorites', supabaseTable: 'favorites', firestoreCollection: COLLECTIONS.favorites },
  { name: 'saved_offers', supabaseTable: 'saved_offers', firestoreCollection: COLLECTIONS.savedOffers },
  { name: 'claimed_offers', supabaseTable: 'claimed_offers', firestoreCollection: COLLECTIONS.claimedOffers },
  { name: 'purchases', supabaseTable: 'purchases', firestoreCollection: COLLECTIONS.purchases },
  { name: 'experience_posts', supabaseTable: 'experience_posts', firestoreCollection: COLLECTIONS.experiencePosts },
  { name: 'support_tickets', supabaseTable: 'support_tickets', firestoreCollection: COLLECTIONS.supportTickets },
  { name: 'team_invites', supabaseTable: 'team_invites', firestoreCollection: COLLECTIONS.teamInvites },
  { name: 'activity_log', supabaseTable: 'activity_log', firestoreCollection: COLLECTIONS.activityLog },
  { name: 'ab_assignments', supabaseTable: 'ab_assignments', firestoreCollection: COLLECTIONS.abAssignments },
  { name: 'ab_events', supabaseTable: 'ab_events', firestoreCollection: COLLECTIONS.abEvents },
];

async function countSupabase(table: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

async function countFirestore(collection: string): Promise<number> {
  const db = getFirestore();
  const snap = await db.collection(collection).count().get();
  return snap.data().count;
}

export interface ValidationResult {
  name: string;
  supabaseCount: number;
  firestoreCount: number;
  match: boolean;
}

export async function validateMigration(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const pair of COUNT_PAIRS) {
    const [supabaseCount, firestoreCount] = await Promise.all([
      countSupabase(pair.supabaseTable),
      countFirestore(pair.firestoreCollection),
    ]);

    results.push({
      name: pair.name,
      supabaseCount,
      firestoreCount,
      match: supabaseCount === firestoreCount,
    });
  }

  return results;
}

export function printValidationReport(results: ValidationResult[]): void {
  console.log('\nMigration validation report');
  console.log('─'.repeat(72));
  console.log(
    `${'Entity'.padEnd(22)} ${'Supabase'.padStart(10)} ${'Firestore'.padStart(10)} ${'Status'.padStart(10)}`,
  );
  console.log('─'.repeat(72));

  for (const row of results) {
    const status = row.match ? 'OK' : 'MISMATCH';
    console.log(
      `${row.name.padEnd(22)} ${String(row.supabaseCount).padStart(10)} ${String(row.firestoreCount).padStart(10)} ${status.padStart(10)}`,
    );
  }

  const mismatches = results.filter((r) => !r.match).length;
  console.log('─'.repeat(72));
  console.log(`Total: ${results.length} entities, ${mismatches} mismatches\n`);
}

async function main() {
  if (process.env.DRY_RUN === 'true') {
    console.log('DRY_RUN=true — validation still queries live counts');
  }

  const results = await validateMigration();
  printValidationReport(results);

  if (results.some((r) => !r.match)) {
    process.exit(1);
  }
}

const isMain = process.argv[1]?.includes('validate');
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
