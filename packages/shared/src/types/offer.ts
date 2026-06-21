import { z } from 'zod';
import type { FirestoreTimestamp } from './common';

export interface Offer {
  id: string;
  title: string;
  brandId: string;
  categoryId: string;
  description: string | null;
  discountCode: string | null;
  discountLabel: string | null;
  discountPercent: number | null;
  imageUrl: string | null;
  redirectUrl: string | null;
  terms: string | null;
  scope: string;
  universityIds: string[];
  active: boolean;
  featured: boolean;
  expiresAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ClaimedOffer {
  id: string;
  offerId: string;
  userId: string;
  codeRevealed: string | null;
  claimedAt: FirestoreTimestamp;
}

export interface SavedOffer {
  id: string;
  offerId: string;
  userId: string;
  createdAt: FirestoreTimestamp;
}

export interface Favorite {
  id: string;
  offerId: string;
  userId: string;
  createdAt: FirestoreTimestamp;
}

export interface Purchase {
  id: string;
  userId: string;
  merchant: string;
  amountPaid: number;
  amountSaved: number;
  currency: string;
  source: string;
  offerId: string | null;
  claimedOfferId: string | null;
  paymentMethod: string | null;
  note: string | null;
  purchasedAt: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface PartnershipRequest {
  id: string;
  brandName: string;
  email: string;
  createdAt: FirestoreTimestamp;
}

export interface FavoriteBrandAlertSent {
  id: string;
  offerId: string;
  userId: string;
  sentAt: FirestoreTimestamp;
}

export const PartnershipRequestSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
});

export type PartnershipRequestInput = z.infer<typeof PartnershipRequestSchema>;
