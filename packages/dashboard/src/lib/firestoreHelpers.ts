import type { FirestoreTimestamp } from '@unidealz/shared';

export function toIsoString(value: FirestoreTimestamp | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000).toISOString();
  }
  return null;
}

export function docWithId<T extends Record<string, unknown>>(id: string, data: T): T & { id: string } {
  return { id, ...data };
}

/** Map Firestore camelCase docs to legacy snake_case shapes used by ported UI. */
export function mapOfferDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    title: String(data.title ?? ''),
    description: (data.description as string | null) ?? null,
    discount_label: (data.discountLabel as string | null) ?? null,
    discount_percent: (data.discountPercent as number | null) ?? null,
    discount_code: (data.discountCode as string | null) ?? null,
    redirect_url: (data.redirectUrl as string | null) ?? null,
    image_url: (data.imageUrl as string | null) ?? null,
    terms: (data.terms as string | null) ?? null,
    featured: Boolean(data.featured),
    active: Boolean(data.active),
    expires_at: toIsoString(data.expiresAt as FirestoreTimestamp | null),
    scope: (data.scope as string | null) ?? null,
    university_ids: (data.universityIds as string[] | null) ?? null,
    brand_id: (data.brandId as string | null) ?? null,
    category_id: (data.categoryId as string | null) ?? null,
    created_at: toIsoString(data.createdAt as FirestoreTimestamp) ?? new Date().toISOString(),
  };
}

export function mapBrandDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    name: String(data.name ?? ''),
    slug: String(data.slug ?? ''),
    logo_url: (data.logoUrl as string | null) ?? null,
    website: (data.website as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    archived_at: toIsoString(data.archivedAt as FirestoreTimestamp | null),
    created_at: toIsoString(data.createdAt as FirestoreTimestamp) ?? new Date().toISOString(),
  };
}

export function mapCategoryDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    name: String(data.name ?? ''),
    slug: String(data.slug ?? ''),
  };
}

export function mapUniversityDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    name: String(data.name ?? ''),
    short_code: (data.shortCode as string | null) ?? null,
    allowed_domains: (data.allowedDomains as string[] | null) ?? [],
  };
}

export function mapExperiencePostDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    user_id: String(data.userId ?? ''),
    title: String(data.title ?? ''),
    content: String(data.content ?? ''),
    brand_id: (data.brandId as string | null) ?? null,
    category_id: (data.categoryId as string | null) ?? null,
    rating: (data.rating as number | null) ?? null,
    savings_amount: (data.savingsAmount as number | null) ?? null,
    location_text: (data.locationText as string | null) ?? null,
    would_recommend: (data.wouldRecommend as boolean | null) ?? null,
    visible: Boolean(data.published ?? data.visible),
    image_urls: (data.imageUrls as string[] | null) ?? [],
    created_at: toIsoString(data.createdAt as FirestoreTimestamp) ?? new Date().toISOString(),
    updated_at: toIsoString(data.updatedAt as FirestoreTimestamp) ?? new Date().toISOString(),
  };
}

export function mapStudentProfileDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    user_id: String(data.userId ?? id),
    student_email: (data.studentEmail as string | null) ?? null,
    university_id: (data.universityId as string | null) ?? null,
    expected_graduation: (data.expectedGraduation as string | null) ?? null,
    verification_status: (data.verificationStatus as string | null) ?? 'pending',
    verified_at: toIsoString(data.verifiedAt as FirestoreTimestamp | null),
    created_at: toIsoString(data.createdAt as FirestoreTimestamp) ?? new Date().toISOString(),
  };
}
