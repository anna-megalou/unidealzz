import {
  COLLECTIONS,
  getDefaultNotificationSettings,
  getDefaultUserSettings,
} from '../constants.js';
type UserSettings = ReturnType<typeof getDefaultUserSettings>;

type FirestoreItem = { collection: string; id: string; data: Record<string, unknown> };

export function buildUserDocuments(
  userIds: Iterable<string>,
  settingsByUser: Map<string, UserSettings>,
): FirestoreItem[] {
  const now = new Date().toISOString();

  return [...userIds].map((userId) => ({
    collection: COLLECTIONS.users,
    id: userId,
    data: {
      userId,
      settings: settingsByUser.get(userId) ?? getDefaultUserSettings(),
      notifications: getDefaultNotificationSettings(),
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    },
  }));
}

export function collectUserIds(rows: Record<string, string>[], field = 'user_id'): Set<string> {
  const userIds = new Set<string>();
  for (const row of rows) {
    const userId = row[field]?.trim();
    if (userId) userIds.add(userId);
  }
  return userIds;
}
