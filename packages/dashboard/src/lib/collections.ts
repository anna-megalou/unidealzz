/** Firestore collection paths aligned with firestore.rules (camelCase). */
export const Collections = {
  USERS: 'users',
  OFFERS: 'offers',
  BRANDS: 'brands',
  CATEGORIES: 'categories',
  UNIVERSITIES: 'universities',
  EXPERIENCE_POSTS: 'experiencePosts',
  SUPPORT_TICKETS: 'supportTickets',
  TEAM_INVITES: 'teamInvites',
  ACTIVITY_LOG: 'activityLog',
  AB_ASSIGNMENTS: 'abAssignments',
  AB_EVENTS: 'abEvents',
  VERIFICATION_REQUESTS: 'verificationRequests',
  PUBLIC_STATS: 'publicStats',
  STUDENT_PROFILES: 'studentProfiles',
} as const;

export const StorageBuckets = {
  BRAND_LOGOS: 'brand-logos',
  EXPERIENCE_IMAGES: 'experience-images',
} as const;

export function userFavoritesPath(userId: string) {
  return `${Collections.USERS}/${userId}/favorites`;
}

export function userSavedOffersPath(userId: string) {
  return `${Collections.USERS}/${userId}/savedOffers`;
}

export function userClaimedOffersPath(userId: string) {
  return `${Collections.USERS}/${userId}/claimedOffers`;
}

export function userPurchasesPath(userId: string) {
  return `${Collections.USERS}/${userId}/purchases`;
}

export function experienceCommentsPath(postId: string) {
  return `${Collections.EXPERIENCE_POSTS}/${postId}/comments`;
}

export function experienceLikesPath(postId: string) {
  return `${Collections.EXPERIENCE_POSTS}/${postId}/likes`;
}
