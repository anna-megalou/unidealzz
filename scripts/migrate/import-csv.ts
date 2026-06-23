import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COLLECTIONS,
  getDefaultUserSettings,
} from './constants.js';
import { getFirestore } from './utils/clients.js';
import {
  emptyToNull,
  parseBooleanField,
  parseJsonArrayField,
  parseJsonObjectField,
  parseNumberField,
  readSemicolonCsv,
} from './utils/csv.js';
import { resolveImportPath } from './utils/csvPaths.js';
import {
  logStep,
  mapCurrency,
  mapTheme,
  mapTimezone,
  toIso,
  toIsoOrNull,
  writeBatch,
} from './utils/firestore.js';
import { buildUserDocuments, collectUserIds } from './utils/userDocs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STEP = 'import-csv';
const DATA_DIR = resolve(__dirname, '../../data');

type ImportPaths = {
  universities: string | null;
  brands: string | null;
  categories: string | null;
  offers: string | null;
  userRoles: string | null;
  abAssignments: string | null;
  abEvents: string | null;
  favorites: string | null;
  partnershipRequests: string | null;
  purchases: string | null;
  studentProfiles: string | null;
  suppressedEmails: string | null;
  verificationRequests: string | null;
  profiles: string | null;
  savedOffers: string | null;
  claimedOffers: string | null;
  supportTickets: string | null;
  teamInvites: string | null;
  userPreferences: string | null;
  userSettings: string | null;
  experiencePosts: string | null;
  experiencePostComments: string | null;
  experiencePostLikes: string | null;
  experiencePostImages: string | null;
  activityLog: string | null;
};

function readOptionalCsv(path: string | null): Record<string, string>[] {
  return path ? readSemicolonCsv(path) : [];
}

function buildUserSettings(row: Record<string, string>) {
  const defaults = getDefaultUserSettings();
  return {
    ...defaults,
    phone: emptyToNull(row.phone) ?? defaults.phone,
    language: row.language || defaults.language,
    timezone: mapTimezone(row.timezone),
    currency: mapCurrency(row.currency),
    theme: mapTheme(row.theme),
    emailNotifications: parseBooleanField(row.email_notifications, defaults.emailNotifications),
    pushNotifications: parseBooleanField(row.push_notifications, defaults.pushNotifications),
    securityAlerts: parseBooleanField(row.security_alerts, defaults.securityAlerts),
    favoriteBrandAlertsOptIn: parseBooleanField(
      row.favorite_brand_alerts_opt_in,
      defaults.favoriteBrandAlertsOptIn,
    ),
    marketingOptIn: parseBooleanField(row.marketing_opt_in, defaults.marketingOptIn),
    savingsGoal: parseNumberField(row.savings_goal, defaults.savingsGoal),
  };
}

function path(envKey: string, fallback: string) {
  return resolveImportPath(DATA_DIR, process.env[envKey], fallback);
}

export function getImportPaths(): ImportPaths {
  return {
    universities: path('CSV_UNIVERSITIES', 'universities-export.csv'),
    brands: path('CSV_BRANDS', 'brands-export.csv'),
    categories: path('CSV_CATEGORIES', 'categories-export.csv'),
    offers: path('CSV_OFFERS', 'offers-export.csv'),
    userRoles: path('CSV_USER_ROLES', 'user_roles-export.csv'),
    abAssignments: path('CSV_AB_ASSIGNMENTS', 'ab_assignments-export.csv'),
    abEvents: path('CSV_AB_EVENTS', 'ab_events-export.csv'),
    favorites: path('CSV_FAVORITES', 'favorites-export.csv'),
    partnershipRequests: path('CSV_PARTNERSHIP_REQUESTS', 'partnership_requests-export.csv'),
    purchases: path('CSV_PURCHASES', 'purchases-export.csv'),
    studentProfiles: path('CSV_STUDENT_PROFILES', 'student_profiles-export.csv'),
    suppressedEmails: path('CSV_SUPPRESSED_EMAILS', 'suppressed_emails-export.csv'),
    verificationRequests: path('CSV_VERIFICATION_REQUESTS', 'verification_requests-export.csv'),
    profiles: path('CSV_PROFILES', 'profiles-export.csv'),
    savedOffers: path('CSV_SAVED_OFFERS', 'saved_offers-export.csv'),
    claimedOffers: path('CSV_CLAIMED_OFFERS', 'claimed_offers-export.csv'),
    supportTickets: path('CSV_SUPPORT_TICKETS', 'support_tickets-export.csv'),
    teamInvites: path('CSV_TEAM_INVITES', 'team_invites-export.csv'),
    userPreferences: path('CSV_USER_PREFERENCES', 'user_preferences-export.csv'),
    userSettings: path('CSV_USER_SETTINGS', 'user_settings-export.csv'),
    experiencePosts: path('CSV_EXPERIENCE_POSTS', 'experience_posts-export.csv'),
    experiencePostComments: path(
      'CSV_EXPERIENCE_POST_COMMENTS',
      'experience_post_comments-export.csv',
    ),
    experiencePostLikes: path('CSV_EXPERIENCE_POST_LIKES', 'experience_post_likes-export.csv'),
    experiencePostImages: path('CSV_EXPERIENCE_POST_IMAGES', 'experience_post_images-export.csv'),
    activityLog: path('CSV_ACTIVITY_LOG', 'activity_log-export.csv'),
  };
}

export async function importCsvData(paths: ImportPaths = getImportPaths()): Promise<void> {
  const universities = readOptionalCsv(paths.universities);
  const brands = readOptionalCsv(paths.brands);
  const categories = readOptionalCsv(paths.categories);
  const offers = readOptionalCsv(paths.offers);
  const userRoles = readOptionalCsv(paths.userRoles);
  const abAssignments = readOptionalCsv(paths.abAssignments);
  const abEvents = readOptionalCsv(paths.abEvents);
  const favorites = readOptionalCsv(paths.favorites);
  const partnershipRequests = readOptionalCsv(paths.partnershipRequests);
  const purchases = readOptionalCsv(paths.purchases);
  const studentProfiles = readOptionalCsv(paths.studentProfiles);
  const suppressedEmails = readOptionalCsv(paths.suppressedEmails);
  const verificationRequests = readOptionalCsv(paths.verificationRequests);
  const profiles = readOptionalCsv(paths.profiles);
  const savedOffers = readOptionalCsv(paths.savedOffers);
  const claimedOffers = readOptionalCsv(paths.claimedOffers);
  const supportTickets = readOptionalCsv(paths.supportTickets);
  const teamInvites = readOptionalCsv(paths.teamInvites);
  const userPreferences = readOptionalCsv(paths.userPreferences);
  const userSettings = readOptionalCsv(paths.userSettings);
  const experiencePosts = readOptionalCsv(paths.experiencePosts);
  const experiencePostComments = readOptionalCsv(paths.experiencePostComments);
  const experiencePostLikes = readOptionalCsv(paths.experiencePostLikes);
  const experiencePostImages = readOptionalCsv(paths.experiencePostImages);
  const activityLog = readOptionalCsv(paths.activityLog);

  const settingsByUser = new Map(
    userSettings.map((row) => [row.user_id, buildUserSettings(row)] as const),
  );

  const userIds = new Set<string>();
  for (const rows of [
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
    experiencePosts,
    experiencePostComments,
    experiencePostLikes,
    experiencePostImages,
  ]) {
    for (const id of collectUserIds(rows)) userIds.add(id);
  }

  const items = [
    ...buildUserDocuments(userIds, settingsByUser),
    ...categories.map((row) => ({
      collection: COLLECTIONS.categories,
      id: row.id,
      data: {
        name: row.name,
        slug: row.slug,
        icon: emptyToNull(row.icon),
        createdAt: toIso(row.created_at),
      },
    })),
    ...universities.map((row) => ({
      collection: COLLECTIONS.universities,
      id: row.id,
      data: {
        name: row.name,
        shortCode: row.short_code,
        allowedDomains: parseJsonArrayField(row.allowed_domains),
        createdAt: toIso(row.created_at),
      },
    })),
    ...brands.map((row) => ({
      collection: COLLECTIONS.brands,
      id: row.id,
      data: {
        name: row.name,
        slug: row.slug,
        description: emptyToNull(row.description),
        logoUrl: emptyToNull(row.logo_url),
        website: emptyToNull(row.website),
        archivedAt: toIsoOrNull(row.archived_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...offers.map((row) => ({
      collection: COLLECTIONS.offers,
      id: row.id,
      data: {
        title: row.title,
        brandId: row.brand_id,
        categoryId: row.category_id,
        description: emptyToNull(row.description),
        discountCode: emptyToNull(row.discount_code),
        discountLabel: emptyToNull(row.discount_label),
        discountPercent: row.discount_percent ? parseNumberField(row.discount_percent) : null,
        imageUrl: emptyToNull(row.image_url),
        redirectUrl: emptyToNull(row.redirect_url),
        terms: emptyToNull(row.terms),
        scope: row.scope || 'national',
        universityIds: parseJsonArrayField(row.university_ids),
        active: parseBooleanField(row.active, true),
        featured: parseBooleanField(row.featured, false),
        expiresAt: toIsoOrNull(row.expires_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...userRoles.map((row) => ({
      collection: COLLECTIONS.userRoles,
      id: row.id,
      data: {
        userId: row.user_id,
        role: row.role,
        createdAt: toIso(row.created_at),
      },
    })),
    ...profiles.map((row) => ({
      collection: COLLECTIONS.profiles,
      id: row.id,
      data: {
        userId: row.user_id,
        displayName: emptyToNull(row.display_name),
        avatarUrl: emptyToNull(row.avatar_url),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...userSettings.map((row) => ({
      collection: COLLECTIONS.userSettings,
      id: row.id,
      data: {
        userId: row.user_id,
        ...buildUserSettings(row),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...userPreferences.map((row) => ({
      collection: COLLECTIONS.userPreferences,
      id: row.id,
      data: {
        userId: row.user_id,
        favoriteCategories: parseJsonArrayField(row.favorite_categories),
        favoriteBrands: parseJsonArrayField(row.favorite_brands),
        budgetPreference: emptyToNull(row.budget_preference),
        onlineVsInstore: emptyToNull(row.online_vs_instore),
        onboarded: parseBooleanField(row.onboarded, false),
        extra: parseJsonObjectField(row.extra) ?? {},
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...abAssignments.map((row) => ({
      collection: COLLECTIONS.abAssignments,
      id: row.id,
      data: {
        experimentKey: row.experiment_key,
        variant: row.variant,
        userId: emptyToNull(row.user_id),
        anonId: emptyToNull(row.anon_id),
        createdAt: toIso(row.created_at),
      },
    })),
    ...abEvents.map((row) => ({
      collection: COLLECTIONS.abEvents,
      id: row.id,
      data: {
        experimentKey: row.experiment_key,
        variant: row.variant,
        eventType: row.event_type,
        userId: emptyToNull(row.user_id),
        anonId: emptyToNull(row.anon_id),
        metadata: parseJsonObjectField(row.metadata) ?? {},
        createdAt: toIso(row.created_at),
      },
    })),
    ...favorites.map((row) => ({
      collection: COLLECTIONS.favorites,
      id: row.id,
      data: {
        userId: row.user_id,
        offerId: row.offer_id,
        createdAt: toIso(row.created_at),
      },
    })),
    ...savedOffers.map((row) => ({
      collection: COLLECTIONS.savedOffers,
      id: row.id,
      data: {
        userId: row.user_id,
        offerId: row.offer_id,
        createdAt: toIso(row.created_at),
      },
    })),
    ...claimedOffers.map((row) => ({
      collection: COLLECTIONS.claimedOffers,
      id: row.id,
      data: {
        userId: row.user_id,
        offerId: row.offer_id,
        codeRevealed: emptyToNull(row.code_revealed),
        claimedAt: toIso(row.claimed_at),
      },
    })),
    ...partnershipRequests.map((row) => ({
      collection: COLLECTIONS.partnershipRequests,
      id: row.id,
      data: {
        email: row.email,
        brandName: row.brand_name,
        createdAt: toIso(row.created_at),
      },
    })),
    ...purchases.map((row) => ({
      collection: COLLECTIONS.purchases,
      id: row.id,
      data: {
        userId: row.user_id,
        offerId: emptyToNull(row.offer_id),
        claimedOfferId: emptyToNull(row.claimed_offer_id),
        merchant: row.merchant,
        amountPaid: parseNumberField(row.amount_paid, 0),
        amountSaved: parseNumberField(row.amount_saved, 0),
        currency: row.currency || 'EUR',
        paymentMethod: emptyToNull(row.payment_method),
        note: emptyToNull(row.note),
        source: row.source || 'manual',
        purchasedAt: toIso(row.purchased_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...studentProfiles.map((row) => ({
      collection: COLLECTIONS.studentProfiles,
      id: row.id,
      data: {
        userId: row.user_id,
        universityId: emptyToNull(row.university_id),
        studentEmail: emptyToNull(row.student_email),
        expectedGraduation: emptyToNull(row.expected_graduation),
        verificationStatus: row.verification_status || 'pending',
        verifiedAt: toIsoOrNull(row.verified_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...suppressedEmails.map((row) => {
      const email = row.email.trim().toLowerCase();
      return {
        collection: COLLECTIONS.suppressedEmails,
        id: email,
        data: {
          email,
          reason: row.reason,
          metadata: parseJsonObjectField(row.metadata),
          createdAt: toIso(row.created_at),
        },
      };
    }),
    ...verificationRequests.map((row) => ({
      collection: COLLECTIONS.verificationRequests,
      id: row.id,
      data: {
        userId: row.user_id,
        universityId: emptyToNull(row.university_id),
        studentEmail: row.student_email,
        status: row.status || 'pending',
        rejectionReason: emptyToNull(row.rejection_reason),
        reviewedAt: toIsoOrNull(row.reviewed_at),
        reviewedBy: emptyToNull(row.reviewed_by),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...supportTickets.map((row) => ({
      collection: COLLECTIONS.supportTickets,
      id: row.id,
      data: {
        userId: emptyToNull(row.user_id),
        fullName: row.full_name,
        studentEmail: row.student_email,
        subject: row.subject,
        message: row.message,
        status: row.status || 'open',
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...teamInvites.map((row) => ({
      collection: COLLECTIONS.teamInvites,
      id: row.id,
      data: {
        email: row.email,
        fullName: emptyToNull(row.full_name),
        role: row.role,
        status: row.status || 'pending',
        invitedBy: emptyToNull(row.invited_by),
        invitedAt: toIso(row.invited_at),
        acceptedAt: toIsoOrNull(row.accepted_at),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...experiencePosts.map((row) => ({
      collection: COLLECTIONS.experiencePosts,
      id: row.id,
      data: {
        userId: row.user_id,
        brandId: emptyToNull(row.brand_id),
        categoryId: emptyToNull(row.category_id),
        title: row.title,
        content: row.content,
        rating: row.rating ? parseNumberField(row.rating) : null,
        wouldRecommend: parseBooleanField(row.would_recommend, false),
        savingsAmount: row.savings_amount ? parseNumberField(row.savings_amount) : null,
        locationText: emptyToNull(row.location_text),
        visible: parseBooleanField(row.visible, true),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...experiencePostComments.map((row) => ({
      collection: COLLECTIONS.experiencePostComments,
      id: row.id,
      data: {
        postId: row.post_id,
        userId: row.user_id,
        content: row.content,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...experiencePostLikes.map((row) => ({
      collection: COLLECTIONS.experiencePostLikes,
      id: row.id,
      data: {
        postId: row.post_id,
        userId: row.user_id,
        createdAt: toIso(row.created_at),
      },
    })),
    ...experiencePostImages.map((row) => ({
      collection: COLLECTIONS.experiencePostImages,
      id: row.id,
      data: {
        postId: row.post_id,
        userId: row.user_id,
        imageUrl: row.image_url,
        position: parseNumberField(row.position, 0),
        createdAt: toIso(row.created_at),
      },
    })),
    ...activityLog.map((row) => ({
      collection: COLLECTIONS.activityLog,
      id: row.id,
      data: {
        actorId: emptyToNull(row.actor_id),
        action: row.action,
        entity: emptyToNull(row.entity),
        entityId: emptyToNull(row.entity_id),
        summary: row.summary,
        metadata: parseJsonObjectField(row.metadata) ?? {},
        createdAt: toIso(row.created_at),
      },
    })),
  ];

  const counts = {
    users: userIds.size,
    categories: categories.length,
    universities: universities.length,
    brands: brands.length,
    offers: offers.length,
    userRoles: userRoles.length,
    profiles: profiles.length,
    userSettings: userSettings.length,
    userPreferences: userPreferences.length,
    abAssignments: abAssignments.length,
    abEvents: abEvents.length,
    favorites: favorites.length,
    savedOffers: savedOffers.length,
    claimedOffers: claimedOffers.length,
    partnershipRequests: partnershipRequests.length,
    purchases: purchases.length,
    studentProfiles: studentProfiles.length,
    suppressedEmails: suppressedEmails.length,
    verificationRequests: verificationRequests.length,
    supportTickets: supportTickets.length,
    teamInvites: teamInvites.length,
    experiencePosts: experiencePosts.length,
    experiencePostComments: experiencePostComments.length,
    experiencePostLikes: experiencePostLikes.length,
    experiencePostImages: experiencePostImages.length,
    activityLog: activityLog.length,
    total: items.length,
  };

  const dryRun = process.env.DRY_RUN === 'true';
  if (dryRun) {
    logStep(STEP, 'Dry run — would write CSV data', counts);
    return;
  }

  const db = getFirestore();
  const batchSize = Number(process.env.MIGRATE_BATCH_SIZE ?? '400');
  const written = await writeBatch(db, items, batchSize);

  logStep(STEP, 'Imported CSV data to Firestore', { ...counts, written });
}

const isMain = process.argv[1]?.includes('import-csv');
if (isMain) {
  importCsvData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
