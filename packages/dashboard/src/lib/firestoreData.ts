import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/collections';
import {
  docWithId,
  mapBrandDoc,
  mapCategoryDoc,
  mapExperiencePostDoc,
  mapOfferDoc,
  mapStudentProfileDoc,
  mapUniversityDoc,
  toIsoString,
} from '@/lib/firestoreHelpers';
import type { DbOffer } from '@/hooks/queries/useOffersQuery';

async function getDocMap(collectionName: string, id: string): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
}

export async function fetchActiveOffers(): Promise<DbOffer[]> {
  const q = query(
    collection(db, Collections.OFFERS),
    where('active', '==', true),
    orderBy('featured', 'desc'),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  const offers = snap.docs.map((d) => mapOfferDoc(d.id, d.data() as Record<string, unknown>));
  return enrichOffers(offers);
}

export async function fetchOfferById(id: string): Promise<DbOffer | null> {
  const data = await getDocMap(Collections.OFFERS, id);
  if (!data) return null;
  const [enriched] = await enrichOffers([mapOfferDoc(id, data)]);
  return enriched ?? null;
}

async function enrichOffers(
  offers: ReturnType<typeof mapOfferDoc>[],
): Promise<DbOffer[]> {
  const brandIds = [...new Set(offers.map((o) => o.brand_id).filter(Boolean))] as string[];
  const categoryIds = [...new Set(offers.map((o) => o.category_id).filter(Boolean))] as string[];

  const brandMap = new Map<string, { id: string; name: string; slug: string; logo_url: string | null }>();
  const categoryMap = new Map<string, { id: string; name: string; slug: string }>();

  await Promise.all(
    brandIds.map(async (id) => {
      const data = await getDocMap(Collections.BRANDS, id);
      if (data) brandMap.set(id, mapBrandDoc(id, data));
    }),
  );
  await Promise.all(
    categoryIds.map(async (id) => {
      const data = await getDocMap(Collections.CATEGORIES, id);
      if (data) categoryMap.set(id, mapCategoryDoc(id, data));
    }),
  );

  return offers.map((o) => ({
    ...o,
    scope: o.scope as DbOffer['scope'],
    brand: o.brand_id ? brandMap.get(o.brand_id) ?? null : null,
    category: o.category_id ? categoryMap.get(o.category_id) ?? null : null,
  }));
}

export async function fetchCategories() {
  const snap = await getDocs(query(collection(db, Collections.CATEGORIES), orderBy('name')));
  return snap.docs.map((d) => mapCategoryDoc(d.id, d.data() as Record<string, unknown>));
}

export async function fetchUniversities() {
  const snap = await getDocs(query(collection(db, Collections.UNIVERSITIES), orderBy('name')));
  return snap.docs.map((d) => mapUniversityDoc(d.id, d.data() as Record<string, unknown>));
}

export async function fetchBrands(activeOnly = true) {
  const snap = await getDocs(query(collection(db, Collections.BRANDS), orderBy('name')));
  let rows = snap.docs.map((d) => mapBrandDoc(d.id, d.data() as Record<string, unknown>));
  if (activeOnly) rows = rows.filter((b) => !b.archived_at);
  return rows;
}

export async function fetchSavedOfferIds(userId: string): Promise<string[]> {
  const snap = await getDocs(collection(db, Collections.USERS, userId, 'savedOffers'));
  return snap.docs.map((d) => String((d.data() as DocumentData).offerId ?? d.id));
}

export async function fetchStudentProfile(userId: string) {
  const q = query(collection(db, Collections.STUDENT_PROFILES), where('userId', '==', userId), limit(1));
  const snap = await getDocs(q);
  const docSnap = snap.docs[0];
  if (!docSnap) return null;
  const profile = mapStudentProfileDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
  if (profile.university_id) {
    const uni = await getDocMap(Collections.UNIVERSITIES, profile.university_id);
    return {
      ...profile,
      university: uni ? mapUniversityDoc(profile.university_id, uni) : null,
    };
  }
  return { ...profile, university: null };
}

export async function isFavorite(userId: string, offerId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, Collections.USERS, userId, 'favorites', offerId));
  return snap.exists();
}

export async function addFavorite(userId: string, offerId: string): Promise<void> {
  await setDoc(doc(db, Collections.USERS, userId, 'favorites', offerId), {
    offerId,
    userId,
    createdAt: new Date().toISOString(),
  });
}

export async function removeFavorite(userId: string, offerId: string): Promise<void> {
  await deleteDoc(doc(db, Collections.USERS, userId, 'favorites', offerId));
}

export async function fetchUserFavorites(userId: string) {
  const snap = await getDocs(
    query(collection(db, Collections.USERS, userId, 'favorites'), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => docWithId(d.id, d.data() as Record<string, unknown>));
}

export async function fetchUserClaimedOffers(userId: string) {
  const snap = await getDocs(
    query(collection(db, Collections.USERS, userId, 'claimedOffers'), orderBy('claimedAt', 'desc')),
  );
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      offer_id: String(data.offerId ?? ''),
      user_id: userId,
      code_revealed: (data.codeRevealed as string | null) ?? null,
      claimed_at: toIsoString(data.claimedAt as never) ?? new Date().toISOString(),
    };
  });
}

export async function fetchUserPurchases(userId: string) {
  const snap = await getDocs(
    query(collection(db, Collections.USERS, userId, 'purchases'), orderBy('purchasedAt', 'desc')),
  );
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      user_id: userId,
      merchant: String(data.merchant ?? ''),
      amount_paid: Number(data.amountPaid ?? 0),
      amount_saved: Number(data.amountSaved ?? 0),
      currency: String(data.currency ?? 'EUR'),
      source: String(data.source ?? ''),
      offer_id: (data.offerId as string | null) ?? null,
      claimed_offer_id: (data.claimedOfferId as string | null) ?? null,
      payment_method: (data.paymentMethod as string | null) ?? null,
      note: (data.note as string | null) ?? null,
      purchased_at: toIsoString(data.purchasedAt as never) ?? new Date().toISOString(),
      created_at: toIsoString(data.createdAt as never) ?? new Date().toISOString(),
    };
  });
}

export async function createExperiencePost(input: {
  userId: string;
  title: string;
  content: string;
  brandId: string | null;
  categoryId: string | null;
  rating: number | null;
  wouldRecommend: boolean;
  savingsAmount: number | null;
  locationText: string | null;
  imageUrls: string[];
}) {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, Collections.EXPERIENCE_POSTS), {
    userId: input.userId,
    title: input.title,
    content: input.content,
    brandId: input.brandId,
    categoryId: input.categoryId,
    rating: input.rating,
    wouldRecommend: input.wouldRecommend,
    savingsAmount: input.savingsAmount,
    locationText: input.locationText,
    imageUrls: input.imageUrls,
    published: true,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function fetchExperiencePosts(limitCount = 50) {
  const snap = await getDocs(
    query(
      collection(db, Collections.EXPERIENCE_POSTS),
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ),
  );
  return snap.docs.map((d) => mapExperiencePostDoc(d.id, d.data() as Record<string, unknown>));
}

export async function countCollection(collectionName: string): Promise<number> {
  const snap = await getCountFromServer(collection(db, collectionName));
  return snap.data().count;
}

export async function countBrandsSince(isoDate: string): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db, Collections.BRANDS), where('createdAt', '>=', isoDate)),
  );
  return snap.data().count;
}

export async function fetchBrandsSince(isoDate: string, max = 6) {
  const snap = await getDocs(
    query(
      collection(db, Collections.BRANDS),
      where('createdAt', '>=', isoDate),
      orderBy('createdAt', 'desc'),
      limit(max),
    ),
  );
  return snap.docs.map((d) => mapBrandDoc(d.id, d.data() as Record<string, unknown>));
}

export async function fetchClaimedOffersSince(isoDate: string) {
  // Aggregate from all users is not feasible client-side; use publicStats or staff callable.
  // Fallback: scan top-level legacy collection if present, else empty.
  try {
    const snap = await getDocs(
      query(collection(db, 'claimedOffers'), where('claimedAt', '>=', isoDate)),
    );
    return snap.docs.map((d) => ({
      claimed_at: toIsoString((d.data() as Record<string, unknown>).claimedAt as never) ?? isoDate,
      offer_id: String((d.data() as Record<string, unknown>).offerId ?? ''),
    }));
  } catch {
    return [] as { claimed_at: string; offer_id: string }[];
  }
}

export async function fetchAbAssignment(userId: string, experimentKey: string) {
  const q = query(
    collection(db, Collections.AB_ASSIGNMENTS),
    where('userId', '==', userId),
    where('experimentKey', '==', experimentKey),
    limit(1),
  );
  const snap = await getDocs(q);
  const row = snap.docs[0]?.data() as Record<string, unknown> | undefined;
  const variant = row?.variant;
  return variant === 'A' || variant === 'B' ? variant : null;
}

export async function createAbAssignment(input: {
  userId: string;
  experimentKey: string;
  variant: 'A' | 'B';
}) {
  await addDoc(collection(db, Collections.AB_ASSIGNMENTS), {
    userId: input.userId,
    experimentKey: input.experimentKey,
    variant: input.variant,
    createdAt: new Date().toISOString(),
  });
}

export async function trackAbEvent(input: {
  userId: string;
  experimentKey: string;
  variant: 'A' | 'B';
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await addDoc(collection(db, Collections.AB_EVENTS), {
    userId: input.userId,
    experimentKey: input.experimentKey,
    variant: input.variant,
    eventType: input.eventType,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  });
}

export async function updateUserSettings(userId: string, settings: Record<string, unknown>) {
  await updateDoc(doc(db, Collections.USERS, userId), {
    settings,
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserSettings(userId: string) {
  const snap = await getDoc(doc(db, Collections.USERS, userId));
  if (!snap.exists()) return null;
  return (snap.data() as Record<string, unknown>).settings as Record<string, unknown> | null;
}

export { Timestamp };
