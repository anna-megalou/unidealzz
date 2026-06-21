import { COLLECTIONS, type Role } from '@unidealz/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { admin, db } from '../../admin';

export async function hasRole(userId: string, role: Role): Promise<boolean> {
  try {
    const user = await admin.auth().getUser(userId);
    const roles = user.customClaims?.roles;
    if (Array.isArray(roles) && roles.includes(role)) {
      return true;
    }
  } catch {
    // Fall through to Firestore lookup
  }

  const snap = await db
    .collection(COLLECTIONS.userRoles)
    .where('userId', '==', userId)
    .where('role', '==', role)
    .limit(1)
    .get();

  return !snap.empty;
}

export async function assignRole(userId: string, role: Role): Promise<void> {
  const existing = await db
    .collection(COLLECTIONS.userRoles)
    .where('userId', '==', userId)
    .where('role', '==', role)
    .limit(1)
    .get();

  if (existing.empty) {
    await db.collection(COLLECTIONS.userRoles).add({
      userId,
      role,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await syncCustomClaims(userId);
}

export async function removeAllRoles(userId: string): Promise<void> {
  const snap = await db
    .collection(COLLECTIONS.userRoles)
    .where('userId', '==', userId)
    .get();

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  await admin.auth().setCustomUserClaims(userId, { roles: [] });
}

export async function syncCustomClaims(userId: string): Promise<void> {
  const snap = await db
    .collection(COLLECTIONS.userRoles)
    .where('userId', '==', userId)
    .get();

  const roles = snap.docs.map((doc) => doc.data().role as Role);
  await admin.auth().setCustomUserClaims(userId, { roles });
}
