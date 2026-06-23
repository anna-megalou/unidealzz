/** Firestore collection names (mirrors @unidealz/shared COLLECTIONS). */
export const COLLECTIONS = {
  users: 'users',
  profiles: 'profiles',
  studentProfiles: 'studentProfiles',
  userSettings: 'userSettings',
  userPreferences: 'userPreferences',
  userRoles: 'userRoles',
  universities: 'universities',
  brands: 'brands',
  categories: 'categories',
  offers: 'offers',
  claimedOffers: 'claimedOffers',
  savedOffers: 'savedOffers',
  favorites: 'favorites',
  purchases: 'purchases',
  experiencePosts: 'experiencePosts',
  experiencePostComments: 'comments',
  experiencePostLikes: 'likes',
  supportTickets: 'supportTickets',
  verificationRequests: 'verificationRequests',
  teamInvites: 'teamInvites',
  activityLog: 'activityLog',
  abAssignments: 'abAssignments',
  abEvents: 'abEvents',
  experiencePostImages: 'experiencePostImages',
  partnershipRequests: 'partnershipRequests',
  suppressedEmails: 'suppressedEmails',
} as const;

export type Role = 'admin' | 'student' | 'curator' | 'analyst';

export function getDefaultUserSettings() {
  return {
    currency: 'EUR',
    emailNotifications: true,
    favoriteBrandAlertsOptIn: true,
    language: 'en',
    marketingOptIn: false,
    phone: null as string | null,
    pushNotifications: true,
    savingsGoal: 0,
    securityAlerts: true,
    theme: 'system' as const,
    timezone: 'Europe/Athens',
  };
}

export function getDefaultNotificationSettings() {
  return { registeredDeviceCount: 0 };
}
