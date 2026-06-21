import { COLLECTIONS } from './constants.js';
import { config } from './config.js';
import { getSupabase, getFirestore } from './utils/clients.js';
import { fetchAllRows, logStep, toIso, toIsoOrNull, writeBatch } from './utils/firestore.js';

const STEP = '02-offers';

export async function migrateOffers(): Promise<void> {
  const supabase = getSupabase();
  const db = getFirestore();

  const offers = await fetchAllRows((from, to) =>
    supabase.from('offers').select('*').range(from, to).then(({ data, error }) => ({
      data,
      error: error as Error | null,
    })),
  );

  const items = offers.map((row) => ({
    collection: COLLECTIONS.offers,
    id: row.id as string,
    data: {
      title: row.title,
      brandId: row.brand_id,
      categoryId: row.category_id,
      description: row.description ?? null,
      discountCode: row.discount_code ?? null,
      discountLabel: row.discount_label ?? null,
      discountPercent: row.discount_percent ?? null,
      imageUrl: row.image_url ?? null,
      redirectUrl: row.redirect_url ?? null,
      terms: row.terms ?? null,
      scope: row.scope ?? 'national',
      universityIds: row.university_ids ?? [],
      active: row.active ?? true,
      featured: row.featured ?? false,
      expiresAt: toIsoOrNull(row.expires_at),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    },
  }));

  if (config.dryRun) {
    logStep(STEP, 'Dry run — would write offers', { count: items.length });
    return;
  }

  const written = await writeBatch(db, items, config.batchSize);
  logStep(STEP, 'Migrated offers', { offers: offers.length, written });
}

const isMain = process.argv[1]?.includes('02-offers');
if (isMain) {
  migrateOffers().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
