import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections, experienceCommentsPath, experienceLikesPath } from '@/lib/collections';
import { mapBrandDoc, mapCategoryDoc, mapExperiencePostDoc, toIsoString } from '@/lib/firestoreHelpers';
import { uploadExperienceImage } from '@/lib/storage';
import type { ExperiencePost } from '@/components/experiences/ExperiencePostCard';

async function fetchUserProfiles(userIds: string[]) {
  const map = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  await Promise.all(
    userIds.map(async (uid) => {
      const snap = await getDoc(doc(db, Collections.USERS, uid));
      if (!snap.exists()) return;
      const data = snap.data();
      map.set(uid, {
        display_name: (data.displayName as string | null) ?? null,
        avatar_url: (data.avatarUrl as string | null) ?? null,
      });
    }),
  );
  return map;
}

export async function fetchExperienceFeed(currentUserId?: string): Promise<ExperiencePost[]> {
  const snap = await getDocs(
    query(
      collection(db, Collections.EXPERIENCE_POSTS),
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50),
    ),
  );

  const rows = snap.docs.map((d) => mapExperiencePostDoc(d.id, d.data() as Record<string, unknown>));
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const profileMap = await fetchUserProfiles(userIds);

  const posts = await Promise.all(
    rows.map(async (row) => {
      const [likesSnap, commentsSnap] = await Promise.all([
        getDocs(collection(db, experienceLikesPath(row.id))),
        getDocs(collection(db, experienceCommentsPath(row.id))),
      ]);
      const likeUserIds = likesSnap.docs.map((d) => d.id);

      let brand: { id: string; name: string; logoUrl: string | null } | null = null;
      let category: { id: string; name: string } | null = null;

      if (row.brand_id) {
        const brandSnap = await getDoc(doc(db, Collections.BRANDS, row.brand_id));
        if (brandSnap.exists()) {
          const b = mapBrandDoc(row.brand_id, brandSnap.data() as Record<string, unknown>);
          brand = { id: b.id, name: b.name, logoUrl: b.logo_url };
        }
      }
      if (row.category_id) {
        const catSnap = await getDoc(doc(db, Collections.CATEGORIES, row.category_id));
        if (catSnap.exists()) {
          const c = mapCategoryDoc(row.category_id, catSnap.data() as Record<string, unknown>);
          category = { id: c.id, name: c.name };
        }
      }

      return {
        id: row.id,
        userId: row.user_id,
        authorName: profileMap.get(row.user_id)?.display_name ?? 'Student',
        authorAvatar: profileMap.get(row.user_id)?.avatar_url ?? null,
        title: row.title,
        content: row.content,
        rating: row.rating,
        wouldRecommend: row.would_recommend,
        savingsAmount: row.savings_amount,
        locationText: row.location_text,
        createdAt: row.created_at,
        brand,
        category,
        images: row.image_urls ?? [],
        likeCount: likeUserIds.length,
        likedByMe: currentUserId ? likeUserIds.includes(currentUserId) : false,
        commentCount: commentsSnap.size,
      } satisfies ExperiencePost;
    }),
  );

  return posts;
}

export async function toggleExperienceLike(postId: string, userId: string, liked: boolean) {
  const ref = doc(db, experienceLikesPath(postId), userId);
  if (liked) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { userId, createdAt: new Date().toISOString() });
  }
}

export async function fetchExperienceComments(postId: string) {
  const snap = await getDocs(
    query(collection(db, experienceCommentsPath(postId)), orderBy('createdAt', 'asc')),
  );
  const rows = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: String(data.userId ?? ''),
      content: String(data.content ?? ''),
      createdAt: toIsoString(data.createdAt as never) ?? new Date().toISOString(),
    };
  });
  const profileMap = await fetchUserProfiles([...new Set(rows.map((r) => r.userId))]);
  return rows.map((r) => ({
    ...r,
    authorName: profileMap.get(r.userId)?.display_name ?? 'Student',
    authorAvatar: profileMap.get(r.userId)?.avatar_url ?? null,
  }));
}

export async function addExperienceComment(postId: string, userId: string, content: string) {
  await addDoc(collection(db, experienceCommentsPath(postId)), {
    userId,
    content,
    createdAt: new Date().toISOString(),
  });
}

export async function createExperiencePost(input: {
  userId: string;
  title: string;
  content: string;
  brandId: string | null;
  categoryId: string | null;
  rating: number;
  wouldRecommend: boolean;
  savings: string;
  location: string;
  files: File[];
}) {
  const now = new Date().toISOString();
  const postRef = await addDoc(collection(db, Collections.EXPERIENCE_POSTS), {
    userId: input.userId,
    title: input.title,
    content: input.content,
    brandId: input.brandId,
    categoryId: input.categoryId,
    rating: input.rating || null,
    wouldRecommend: input.wouldRecommend,
    savingsAmount: input.savings ? parseFloat(input.savings) : null,
    locationText: input.location || null,
    imageUrls: [] as string[],
    published: true,
    createdAt: now,
    updatedAt: now,
  });

  const imageUrls = await Promise.all(
    input.files.map((file, index) =>
      uploadExperienceImage(file, input.userId, postRef.id, index),
    ),
  );

  if (imageUrls.length > 0) {
    await setDoc(postRef, { imageUrls, updatedAt: new Date().toISOString() }, { merge: true });
  }

  return postRef.id;
}

export async function fetchTrendingBrands(limitCount = 5) {
  const snap = await getDocs(
    query(collection(db, Collections.BRANDS), where('archivedAt', '==', null), orderBy('name'), limit(limitCount)),
  );
  return snap.docs.map((d) => mapBrandDoc(d.id, d.data() as Record<string, unknown>));
}

export async function fetchMostLikedPosts(limitCount = 3) {
  const posts = await fetchExperienceFeed();
  return posts.sort((a, b) => b.likeCount - a.likeCount).slice(0, limitCount);
}
