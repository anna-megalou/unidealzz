import { COLLECTIONS } from './constants.js';
import { config } from './config.js';
import { getSupabase, getFirestore, getStorage } from './utils/clients.js';
import { fetchAllRows, logStep, toIso, writeBatch } from './utils/firestore.js';

const STEP = '05-experiences';

async function copyStorageFile(sourceUrl: string, destPath: string): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      console.warn(`[${STEP}] Failed to download ${sourceUrl}: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const bucket = getStorage().bucket(config.experienceStorageBucket);
    const file = bucket.file(destPath);
    await file.save(buffer, {
      metadata: { contentType: response.headers.get('content-type') ?? 'image/jpeg' },
    });
    await file.makePublic();
    return `https://storage.googleapis.com/${config.experienceStorageBucket}/${destPath}`;
  } catch (err) {
    console.warn(`[${STEP}] Storage copy failed for ${sourceUrl}`, err);
    return null;
  }
}

export async function migrateExperiences(): Promise<void> {
  const supabase = getSupabase();
  const db = getFirestore();

  const [posts, comments, likes, images] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase.from('experience_posts').select('*').range(from, to).then(({ data, error }) => ({
        data,
        error: error as Error | null,
      })),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from('experience_post_comments')
        .select('*')
        .range(from, to)
        .then(({ data, error }) => ({ data, error: error as Error | null })),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from('experience_post_likes')
        .select('*')
        .range(from, to)
        .then(({ data, error }) => ({ data, error: error as Error | null })),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from('experience_post_images')
        .select('*')
        .range(from, to)
        .then(({ data, error }) => ({ data, error: error as Error | null })),
    ),
  ]);

  const imageUrlMap = new Map<string, string>();

  if (!config.dryRun) {
    for (const image of images) {
      const sourceUrl = image.image_url as string;
      if (!sourceUrl) continue;

      const userId = image.user_id as string;
      const fileName = sourceUrl.split('/').pop() ?? `${image.id}.jpg`;
      const destPath = `${userId}/${image.post_id}/${fileName}`;
      const newUrl = await copyStorageFile(sourceUrl, destPath);
      if (newUrl) {
        imageUrlMap.set(image.id as string, newUrl);
      }
    }
  }

  const items = [
    ...posts.map((row) => ({
      collection: COLLECTIONS.experiencePosts,
      id: row.id as string,
      data: {
        userId: row.user_id,
        brandId: row.brand_id ?? null,
        categoryId: row.category_id ?? null,
        title: row.title,
        content: row.content,
        rating: row.rating ?? null,
        wouldRecommend: row.would_recommend ?? null,
        savingsAmount: row.savings_amount != null ? Number(row.savings_amount) : null,
        locationText: row.location_text ?? null,
        visible: row.visible ?? true,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...comments.map((row) => ({
      collection: COLLECTIONS.experiencePostComments,
      id: row.id as string,
      data: {
        postId: row.post_id,
        userId: row.user_id,
        content: row.content,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
    })),
    ...likes.map((row) => ({
      collection: COLLECTIONS.experiencePostLikes,
      id: row.id as string,
      data: {
        postId: row.post_id,
        userId: row.user_id,
        createdAt: toIso(row.created_at),
      },
    })),
    ...images.map((row) => ({
      collection: COLLECTIONS.experiencePostImages,
      id: row.id as string,
      data: {
        postId: row.post_id,
        userId: row.user_id,
        imageUrl: imageUrlMap.get(row.id as string) ?? row.image_url,
        position: row.position ?? 0,
        createdAt: toIso(row.created_at),
      },
    })),
  ];

  if (config.dryRun) {
    logStep(STEP, 'Dry run — would write experiences', {
      posts: posts.length,
      images: images.length,
    });
    return;
  }

  const written = await writeBatch(db, items, config.batchSize);
  logStep(STEP, 'Migrated experiences', {
    posts: posts.length,
    comments: comments.length,
    likes: likes.length,
    images: images.length,
    storageCopied: imageUrlMap.size,
    written,
  });
}

const isMain = process.argv[1]?.includes('05-experiences');
if (isMain) {
  migrateExperiences().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
