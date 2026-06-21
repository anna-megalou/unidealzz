import type { Brand, Category, Offer } from '@unidealz/shared';

export interface OfferBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface OfferCategory {
  id: string;
  name: string;
  slug: string;
}

/** View-model for public offer listings (legacy snake_case shape for page compatibility). */
export interface PublicOffer {
  id: string;
  title: string;
  description: string | null;
  discount_label: string | null;
  discount_percent: number | null;
  discount_code: string | null;
  redirect_url: string | null;
  image_url: string | null;
  terms: string | null;
  featured: boolean;
  active: boolean;
  expires_at: string | null;
  scope?: 'local' | 'national' | 'online' | null;
  university_ids?: string[] | null;
  brand: OfferBrand | null;
  category: OfferCategory | null;
}

export function mapBrand(doc: Brand): OfferBrand {
  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug,
    logo_url: doc.logoUrl,
  };
}

export function mapCategory(doc: Category): OfferCategory {
  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug,
  };
}

export function mapOffer(
  offer: Offer,
  brand: OfferBrand | null,
  category: OfferCategory | null,
): PublicOffer {
  const expiresAt =
    offer.expiresAt == null
      ? null
      : typeof offer.expiresAt === 'string'
        ? offer.expiresAt
        : offer.expiresAt.toDate?.()?.toISOString?.() ??
          new Date(offer.expiresAt.seconds * 1000).toISOString();

  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    discount_label: offer.discountLabel,
    discount_percent: offer.discountPercent,
    discount_code: offer.discountCode,
    redirect_url: offer.redirectUrl,
    image_url: offer.imageUrl,
    terms: offer.terms,
    featured: offer.featured,
    active: offer.active,
    expires_at: expiresAt,
    scope: (offer.scope as PublicOffer['scope']) ?? 'national',
    university_ids: offer.universityIds ?? [],
    brand,
    category,
  };
}

/** Legacy alias used by copied pages. */
export type DbOffer = PublicOffer;
