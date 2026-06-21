import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@unidealz/shared';
import { CALLABLE_CONFIG } from '../config';
import { db } from '../admin';
import { requireStaff } from '../utils/requireAdmin';
import { logActivity } from '../services/activity/activityCore';

interface ManageBrandRequest {
  action: 'create' | 'update' | 'archive' | 'updateUser';
  brandId?: string;
  payload: Record<string, unknown>;
}

export const manageBrand = onCall(CALLABLE_CONFIG, async (request) => {
  const uid = await requireStaff(request);
  const { action, brandId, payload } = request.data as ManageBrandRequest;

  if (action === 'updateUser') {
    const userId = String(payload.userId ?? '');
    if (!userId) throw new HttpsError('invalid-argument', 'userId required');
    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (payload.settings) updates.settings = payload.settings;
    if (payload.displayName) updates.displayName = payload.displayName;
    await db.collection(COLLECTIONS.users).doc(userId).set(updates, { merge: true });
    return { brandId: userId };
  }

  const now = FieldValue.serverTimestamp();

  if (action === 'create') {
    const ref = await db.collection(COLLECTIONS.brands).add({
      name: payload.name,
      slug: payload.slug,
      website: payload.website ?? null,
      description: payload.description ?? null,
      logoUrl: payload.logoUrl ?? null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    await logActivity({
      actorId: uid,
      action: 'brand.created',
      entity: 'brand',
      entityId: ref.id,
      summary: `Created brand ${payload.name}`,
    });
    return { brandId: ref.id };
  }

  if (!brandId) throw new HttpsError('invalid-argument', 'brandId required');

  if (action === 'archive') {
    await db.collection(COLLECTIONS.brands).doc(brandId).update({
      archivedAt: now,
      updatedAt: now,
    });
    await logActivity({
      actorId: uid,
      action: 'brand.archived',
      entity: 'brand',
      entityId: brandId,
      summary: `Archived brand ${brandId}`,
    });
    return { brandId };
  }

  if (action === 'update') {
    const updates: Record<string, unknown> = {
      updatedAt: now,
    };
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.slug !== undefined) updates.slug = payload.slug;
    if (payload.website !== undefined) updates.website = payload.website ?? null;
    if (payload.description !== undefined) updates.description = payload.description ?? null;
    if (payload.logoUrl !== undefined) updates.logoUrl = payload.logoUrl ?? null;
    if (payload.unarchive === true) updates.archivedAt = null;

    await db.collection(COLLECTIONS.brands).doc(brandId).update(updates);
    await logActivity({
      actorId: uid,
      action: 'brand.updated',
      entity: 'brand',
      entityId: brandId,
      summary: `Updated brand ${payload.name ?? brandId}`,
    });
    return { brandId };
  }

  throw new HttpsError('invalid-argument', 'Unknown action');
});
