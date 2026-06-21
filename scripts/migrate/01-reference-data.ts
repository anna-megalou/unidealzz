import { COLLECTIONS } from './constants.js';
import { config } from './config.js';
import { getSupabase, getFirestore } from './utils/clients.js';
import { fetchAllRows, logStep, toIso, writeBatch } from './utils/firestore.js';

const STEP = '01-reference-data';

export async function migrateReferenceData(): Promise<void> {
  const supabase = getSupabase();
  const db = getFirestore();

  const [categories, universities, brands] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase.from('categories').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('universities').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('brands').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
  ]);

  const items = [
    ...categories.map((row) => ({
      collection: COLLECTIONS.categories,
      id: row.id as string,
      data: {
        name: row.name,
        slug: row.slug,
        icon: row.icon ?? null,
        createdAt: toIso(row.created_at),
      },
    })),
    ...universities.map((row) => ({
      collection: COLLECTIONS.universities,
      id: row.id as string,
      data: {
        name: row.name,
        shortCode: row.short_code,
        allowedDomains: row.allowed_domains ?? [],
        createdAt: toIso(row.created_at),
      },
    })),
    ...brands.map((row) => ({
      collection: COLLECTIONS.brands,
      id: row.id as string,
      data: {
        name: row.name,
        slug: row.slug,
        description: row.description ?? null,
        logoUrl: row.logo_url ?? null,
        website: row.website ?? null,
        archivedAt: row.archived_at ? toIso(row.archived_at) : null,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
  ];

  if (config.dryRun) {
    logStep(STEP, 'Dry run — would write documents', { count: items.length });
    return;
  }

  const written = await writeBatch(db, items, config.batchSize);
  logStep(STEP, 'Migrated reference data', {
    categories: categories.length,
    universities: universities.length,
    brands: brands.length,
    written,
  });
}

const isMain = process.argv[1]?.includes('01-reference-data');
if (isMain) {
  migrateReferenceData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
