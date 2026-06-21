import { z } from 'zod';
import type { FirestoreTimestamp } from './common';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

// User settings (user_settings collection)
export interface UserSettings {
  currency: string;
  emailNotifications: boolean;
  favoriteBrandAlertsOptIn: boolean;
  language: string;
  marketingOptIn: boolean;
  phone: string | null;
  pushNotifications: boolean;
  savingsGoal: number;
  securityAlerts: boolean;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
}

// Profile document (profiles collection)
export interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// Student profile document (student_profiles collection)
export interface StudentProfile {
  id: string;
  userId: string;
  studentEmail: string | null;
  universityId: string | null;
  expectedGraduation: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// Notification settings (stored on user doc — no raw FCM tokens here)
export interface NotificationSettings {
  /** Maintained by Cloud Functions from the fcmTokens subcollection (max 20). */
  registeredDeviceCount: number;
}

// Core User interface (stored in Firestore users collection)
// Note: email, displayName and photoUrl come from Firebase Auth SDK, not stored here
export interface User {
  userId: string;
  settings: UserSettings;
  notifications: NotificationSettings;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User document for Firestore (ISO date strings)
export interface UserDocument {
  userId: string;
  settings: UserSettings;
  notifications: NotificationSettings;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

// Create user input
export interface CreateUserInput {
  userId: string;
}

// Account summary returned to client from getUserDetails (push device count only)
// Note: email, displayName and photoUrl should be merged from Firebase Auth on the client
export interface UserAccountProfile {
  userId: string;
  settings: UserSettings;
  notifications: {
    enabled: boolean;
    tokenCount: number;
  };
  lastLoginAt: string;
}

// Zod schemas
export const UserSettingsSchema = z.object({
  currency: z.string().min(1).max(10),
  emailNotifications: z.boolean(),
  favoriteBrandAlertsOptIn: z.boolean(),
  language: z.string().min(2).max(10),
  marketingOptIn: z.boolean(),
  phone: z.string().max(30).nullable(),
  pushNotifications: z.boolean(),
  savingsGoal: z.number().min(0),
  securityAlerts: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  timezone: z.string().min(1).max(64),
});

export const NotificationSettingsSchema = z.object({
  registeredDeviceCount: z.number().int().min(0).max(20),
});

export const CreateUserSchema = z.object({
  userId: z.string().min(1),
});

export const SignUpSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    universityId: z.string().min(1),
    academicId: z.string().regex(/^\d{12}$/, 'Academic ID must be exactly 12 digits'),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
    marketingOptIn: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof SignUpSchema>;

// Helper functions
export function userToDocument(user: User): UserDocument {
  return {
    ...user,
    lastLoginAt: user.lastLoginAt.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** Normalize Firestore notifications (supports legacy fcmTokens[] until migrated). */
export function parseNotificationSettingsFromDoc(raw: unknown): NotificationSettings {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (typeof o.registeredDeviceCount === 'number' && Number.isFinite(o.registeredDeviceCount)) {
      return {
        registeredDeviceCount: Math.max(0, Math.min(20, Math.floor(o.registeredDeviceCount))),
      };
    }
    if (Array.isArray(o.fcmTokens)) {
      return { registeredDeviceCount: o.fcmTokens.length };
    }
  }
  return getDefaultNotificationSettings();
}

export function documentToUser(doc: UserDocument): User {
  return {
    ...doc,
    notifications: parseNotificationSettingsFromDoc(doc.notifications),
    lastLoginAt: new Date(doc.lastLoginAt),
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

export function getDefaultUserSettings(): UserSettings {
  return {
    currency: 'EUR',
    emailNotifications: true,
    favoriteBrandAlertsOptIn: true,
    language: 'en',
    marketingOptIn: false,
    phone: null,
    pushNotifications: true,
    savingsGoal: 0,
    securityAlerts: true,
    theme: 'system',
    timezone: 'Europe/Athens',
  };
}

export function getDefaultNotificationSettings(): NotificationSettings {
  return {
    registeredDeviceCount: 0,
  };
}

export function userToAccountProfile(user: User): UserAccountProfile {
  const n = user.notifications.registeredDeviceCount;
  return {
    userId: user.userId,
    settings: user.settings,
    notifications: {
      enabled: n > 0,
      tokenCount: n,
    },
    lastLoginAt: user.lastLoginAt.toISOString(),
  };
}
