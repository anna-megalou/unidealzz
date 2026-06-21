import { z } from 'zod';
import type { FirestoreTimestamp } from './common';

export interface ExperiencePost {
  id: string;
  userId: string;
  title: string;
  content: string;
  brandId: string | null;
  categoryId: string | null;
  rating: number | null;
  savingsAmount: number | null;
  locationText: string | null;
  wouldRecommend: boolean | null;
  visible: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ExperiencePostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ExperiencePostImage {
  id: string;
  postId: string;
  userId: string;
  imageUrl: string;
  position: number;
  createdAt: FirestoreTimestamp;
}

export interface ExperiencePostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: FirestoreTimestamp;
}

export const ExperiencePostSchema = z.object({
  title: z.string().trim().min(3).max(120),
  content: z.string().trim().min(10).max(2000),
  rating: z.number().int().min(0).max(5),
  brandId: z.string().nullable(),
  categoryId: z.string().nullable(),
  wouldRecommend: z.boolean(),
  savings: z.string().max(20).optional(),
  location: z.string().max(120).optional(),
});

export type ExperiencePostInput = z.infer<typeof ExperiencePostSchema>;

export const EXPERIENCE_POST_MAX_IMAGES = 4;
export const EXPERIENCE_POST_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
