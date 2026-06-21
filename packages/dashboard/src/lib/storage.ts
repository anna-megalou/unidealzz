import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { app } from '@/lib/firebase';
import { StorageBuckets } from '@/lib/collections';

const storage = getStorage(app);

export async function uploadBrandLogo(file: File, brandSlug: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${brandSlug}-${Date.now()}.${ext}`;
  const storageRef = ref(storage, `${StorageBuckets.BRAND_LOGOS}/${path}`);
  await uploadBytes(storageRef, file, { contentType: file.type, cacheControl: 'public,max-age=3600' });
  return getDownloadURL(storageRef);
}

export async function uploadExperienceImage(
  file: File,
  userId: string,
  postId: string,
  index: number,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `users/${userId}/${postId}/${Date.now()}-${index}.${ext}`;
  const storageRef = ref(storage, `${StorageBuckets.EXPERIENCE_IMAGES}/${path}`);
  await uploadBytes(storageRef, file, { contentType: file.type, cacheControl: 'public,max-age=3600' });
  return getDownloadURL(storageRef);
}

export function getPublicStorageUrl(bucket: string, path: string): string {
  const bucketName = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string;
  const encoded = encodeURIComponent(`${bucket}/${path}`);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media`;
}
