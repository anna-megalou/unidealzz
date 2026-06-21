import {
  COLLECTIONS,
  getDefaultNotificationSettings,
  getDefaultUserSettings,
} from './constants.js';
import { config } from './config.js';
import { getSupabase, getFirestore } from './utils/clients.js';
import {
  fetchAllRows,
  logStep,
  mapCurrency,
  mapTheme,
  mapTimezone,
  toIso,
  toIsoOrNull,
  writeBatch,
} from './utils/firestore.js';

const STEP = '04-user-data';

function buildUserSettings(row: Record<string, unknown>) {
  const defaults = getDefaultUserSettings();
  return {
    ...defaults,
    phone: (row.phone as string | null) ?? defaults.phone,
    language: String(row.language ?? defaults.language),
    timezone: mapTimezone(row.timezone),
    currency: mapCurrency(row.currency),
    theme: mapTheme(row.theme),
    emailNotifications: row.email_notifications ?? defaults.emailNotifications,
    pushNotifications: row.push_notifications ?? defaults.pushNotifications,
    securityAlerts: row.security_alerts ?? defaults.securityAlerts,
    favoriteBrandAlertsOptIn: row.favorite_brand_alerts_opt_in ?? defaults.favoriteBrandAlertsOptIn,
    marketingOptIn: row.marketing_opt_in ?? defaults.marketingOptIn,
    savingsGoal: row.savings_goal ?? defaults.savingsGoal,
  };
}

export async function migrateUserData(): Promise<void> {
  const supabase = getSupabase();
  const db = getFirestore();

  const [
    profiles,
    studentProfiles,
    userSettings,
    userPreferences,
    userRoles,
    favorites,
    savedOffers,
    claimedOffers,
    purchases,
    verificationRequests,
  ] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase.from('profiles').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('student_profiles').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('user_settings').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('user_preferences').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('user_roles').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('favorites').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('saved_offers').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('claimed_offers').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('purchases').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase.from('verification_requests').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
  ]);

  const settingsByUser = new Map(
    userSettings.map((row) => [row.user_id as string, buildUserSettings(row)]),
  );

  const userIds = new Set<string>();
  for (const list of [
    profiles,
    studentProfiles,
    userSettings,
    userPreferences,
    userRoles,
    favorites,
    savedOffers,
    claimedOffers,
    purchases,
  ]) {
    for (const row of list) {
      const uid = (row.user_id as string | undefined) ?? undefined;
      if (uid) userIds.add(uid);
    }
  }

  const now = new Date().toISOString();
  const userDocs = [...userIds].map((userId) => ({
    collection: COLLECTIONS.users,
    id: userId,
    data: {
      userId,
      settings: settingsByUser.get(userId) ?? getDefaultUserSettings(),
      notifications: getDefaultNotificationSettings(),
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    },
  }));

  const items = [
    ...userDocs,
    ...profiles.map((row) => ({
      collection: COLLECTIONS.profiles,
      id: row.id as string,
      data: {
        userId: row.user_id,
        displayName: row.display_name ?? null,
        avatarUrl: row.avatar_url ?? null,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...studentProfiles.map((row) => ({
      collection: COLLECTIONS.studentProfiles,
      id: row.id as string,
      data: {
        userId: row.user_id,
        universityId: row.university_id ?? null,
        studentEmail: row.student_email ?? null,
        expectedGraduation: row.expected_graduation ?? null,
        verificationStatus: row.verification_status ?? 'pending',
        verifiedAt: toIsoOrNull(row.verified_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...userSettings.map((row) => ({
      collection: COLLECTIONS.userSettings,
      id: row.id as string,
      data: {
        userId: row.user_id,
        ...buildUserSettings(row),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...userPreferences.map((row) => ({
      collection: COLLECTIONS.userPreferences,
      id: row.id as string,
      data: {
        userId: row.user_id,
        favoriteCategories: row.favorite_categories ?? [],
        favoriteBrands: row.favorite_brands ?? [],
        budgetPreference: row.budget_preference ?? null,
        onlineVsInstore: row.online_vs_instore ?? null,
        onboarded: row.onboarded ?? false,
        extra: row.extra ?? {},
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...userRoles.map((row) => ({
      collection: COLLECTIONS.userRoles,
      id: row.id as string,
      data: {
        userId: row.user_id,
        role: row.role,
        createdAt: toIso(row.created_at),
      },
    })),
    ...favorites.map((row) => ({
      collection: COLLECTIONS.favorites,
      id: row.id as string,
      data: {
        userId: row.user_id,
        offerId: row.offer_id,
        createdAt: toIso(row.created_at),
      },
    })),
    ...savedOffers.map((row) => ({
      collection: COLLECTIONS.savedOffers,
      id: row.id as string,
      data: {
        userId: row.user_id,
        offerId: row.offer_id,
        createdAt: toIso(row.created_at),
      },
    })),
    ...claimedOffers.map((row) => ({
      collection: COLLECTIONS.claimedOffers,
      id: row.id as string,
      data: {
        userId: row.user_id,
        offerId: row.offer_id,
        codeRevealed: row.code_revealed ?? null,
        claimedAt: toIso(row.claimed_at),
      },
    })),
    ...purchases.map((row) => ({
      collection: COLLECTIONS.purchases,
      id: row.id as string,
      data: {
        userId: row.user_id,
        offerId: row.offer_id ?? null,
        claimedOfferId: row.claimed_offer_id ?? null,
        merchant: row.merchant,
        amountPaid: Number(row.amount_paid ?? 0),
        amountSaved: Number(row.amount_saved ?? 0),
        currency: row.currency ?? 'EUR',
        paymentMethod: row.payment_method ?? null,
        note: row.note ?? null,
        source: row.source ?? 'manual',
        purchasedAt: toIso(row.purchased_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...verificationRequests.map((row) => ({
      collection: COLLECTIONS.verificationRequests,
      id: row.id as string,
      data: {
        userId: row.user_id,
        universityId: row.university_id ?? null,
        studentEmail: row.student_email,
        status: row.status ?? 'pending',
        rejectionReason: row.rejection_reason ?? null,
        reviewedAt: toIsoOrNull(row.reviewed_at),
        reviewedBy: row.reviewed_by ?? null,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
  ];

  if (config.dryRun) {
    logStep(STEP, 'Dry run — would write user data', { count: items.length });
    return;
  }

  const written = await writeBatch(db, items, config.batchSize);
  logStep(STEP, 'Migrated user data', {
    users: userDocs.length,
    profiles: profiles.length,
    studentProfiles: studentProfiles.length,
    favorites: favorites.length,
    savedOffers: savedOffers.length,
    claimedOffers: claimedOffers.length,
    purchases: purchases.length,
    written,
  });
}

const isMain = process.argv[1]?.includes('04-user-data');
if (isMain) {
  migrateUserData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
