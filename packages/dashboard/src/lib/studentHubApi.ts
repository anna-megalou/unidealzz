import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/collections';
import {
  fetchOfferById,
  fetchUserClaimedOffers,
  fetchUserFavorites,
  fetchUserPurchases,
  getUserSettings,
  updateUserSettings,
} from '@/lib/firestoreData';
import { mapStudentProfileDoc, toIsoString } from '@/lib/firestoreHelpers';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512446816042-444d641267d4?auto=format&fit=crop&w=900&q=80';

export async function fetchSavedDeals(userId: string) {
  const favorites = await fetchUserFavorites(userId);
  const rows = await Promise.all(
    favorites.map(async (fav) => {
      const offerId = String(fav.offerId ?? fav.id);
      const offer = await fetchOfferById(offerId);
      if (!offer) return null;
      return {
        favoriteId: fav.id,
        offerId: offer.id,
        title: offer.title,
        description: offer.description,
        image: offer.image_url ?? FALLBACK_IMAGE,
        category: (offer.category?.name ?? offer.brand?.name ?? 'OFFER').toUpperCase(),
        badge: offer.discount_label ?? (offer.featured ? 'FEATURED' : 'SAVED'),
      };
    }),
  );
  return rows.filter(Boolean) as Array<{
    favoriteId: string;
    offerId: string;
    title: string;
    description: string | null;
    image: string;
    category: string;
    badge: string;
  }>;
}

export async function removeSavedDeal(userId: string, favoriteId: string) {
  await deleteDoc(doc(db, Collections.USERS, userId, 'favorites', favoriteId));
}

export async function fetchClaimedDeals(userId: string) {
  const claimed = await fetchUserClaimedOffers(userId);
  return Promise.all(
    claimed.map(async (c) => {
      const offer = c.offer_id ? await fetchOfferById(c.offer_id) : null;
      return {
        id: c.id,
        offerId: c.offer_id,
        title: offer?.title ?? 'Offer',
        code: c.code_revealed,
        claimedAt: c.claimed_at,
        image: offer?.image_url ?? FALLBACK_IMAGE,
        brand: offer?.brand?.name ?? null,
      };
    }),
  );
}

export async function fetchPurchasesWithProfile(userId: string) {
  const purchases = await fetchUserPurchases(userId);
  const settings = await getUserSettings(userId);
  const profileSnap = await getDoc(doc(db, Collections.USERS, userId));
  const profile = profileSnap.data() ?? {};
  return {
    purchases,
    displayName: String(profile.displayName ?? ''),
    settings,
  };
}

export async function addPurchase(userId: string, data: Record<string, unknown>) {
  await addDoc(collection(db, Collections.USERS, userId, 'purchases'), {
    ...data,
    userId,
    createdAt: new Date().toISOString(),
    purchasedAt: data.purchasedAt ?? new Date().toISOString(),
  });
}

export async function deletePurchase(userId: string, purchaseId: string) {
  await deleteDoc(doc(db, Collections.USERS, userId, 'purchases', purchaseId));
}

export async function fetchAccountData(userId: string) {
  const [userSnap, uniSnap, studentSnap] = await Promise.all([
    getDoc(doc(db, Collections.USERS, userId)),
    getDocs(query(collection(db, Collections.UNIVERSITIES), orderBy('name'))),
    getDocs(query(collection(db, Collections.STUDENT_PROFILES), where('userId', '==', userId))),
  ]);

  const userData = userSnap.data() ?? {};
  const studentDoc = studentSnap.docs[0];
  const student = studentDoc
    ? mapStudentProfileDoc(studentDoc.id, studentDoc.data() as Record<string, unknown>)
    : null;

  return {
    displayName: String(userData.displayName ?? ''),
    avatarUrl: (userData.avatarUrl as string | null) ?? null,
    student,
    universities: uniSnap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? '') })),
  };
}

export async function saveAccountData(
  userId: string,
  input: {
    displayName: string;
    universityId: string | null;
    studentEmail: string | null;
    expectedGraduation: string | null;
  },
) {
  await updateDoc(doc(db, Collections.USERS, userId), {
    displayName: input.displayName,
    updatedAt: new Date().toISOString(),
  });

  const studentQuery = query(collection(db, Collections.STUDENT_PROFILES), where('userId', '==', userId));
  const existing = await getDocs(studentQuery);
  const payload = {
    userId,
    studentEmail: input.studentEmail,
    universityId: input.universityId,
    expectedGraduation: input.expectedGraduation,
    updatedAt: new Date().toISOString(),
  };

  if (existing.docs[0]) {
    await updateDoc(existing.docs[0].ref, payload);
  } else {
    await addDoc(collection(db, Collections.STUDENT_PROFILES), {
      ...payload,
      verificationStatus: 'pending',
      createdAt: new Date().toISOString(),
    });
  }
}

export async function fetchHubSummary(userId: string) {
  const userSnap = await getDoc(doc(db, Collections.USERS, userId));
  const userData = userSnap.data() ?? {};
  const studentSnap = await getDocs(
    query(collection(db, Collections.STUDENT_PROFILES), where('userId', '==', userId)),
  );
  const student = studentSnap.docs[0]?.data();

  const [claimed, favorites, purchases] = await Promise.all([
    fetchUserClaimedOffers(userId),
    fetchUserFavorites(userId),
    fetchUserPurchases(userId),
  ]);

  return {
    displayName: String(userData.displayName ?? 'Student'),
    avatarUrl: (userData.avatarUrl as string | null) ?? null,
    emailConfirmed: true,
    verification: {
      status: (student?.verificationStatus as 'pending' | 'approved' | 'rejected' | null) ?? null,
      verifiedAt: toIsoString(student?.verifiedAt as never),
    },
    claimedCount: claimed.length,
    savedCount: favorites.length,
    purchaseCount: purchases.length,
  };
}

export async function fetchUserSettingsPage(userId: string) {
  const settings = await getUserSettings(userId);
  const userSnap = await getDoc(doc(db, Collections.USERS, userId));
  return {
    settings: settings ?? {},
    displayName: String(userSnap.data()?.displayName ?? ''),
  };
}

export { updateUserSettings };
