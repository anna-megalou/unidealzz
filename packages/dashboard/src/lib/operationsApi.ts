import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import {
  callDeleteStaffMember,
  callManageBrand,
  callSendTeamInvite,
  callSendTransactionalEmail,
  db,
} from '@/lib/firebase';
import { Collections } from '@/lib/collections';
import { fetchBrands } from '@/lib/firestoreData';
import { mapBrandDoc, toIsoString } from '@/lib/firestoreHelpers';
import { uploadBrandLogo } from '@/lib/storage';
import type { FirestoreTimestamp } from '@unidealz/shared';

export type BrandRecord = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
  logo_url: string | null;
};

export async function listBrands(includeArchived = false): Promise<BrandRecord[]> {
  const rows = await fetchBrands(!includeArchived);
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    website: b.website,
    description: b.description,
    logo_url: b.logo_url,
  }));
}

export async function saveBrand(input: {
  brandId?: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  logoFile?: File | null;
}) {
  let logoUrl = input.logoUrl;
  if (input.logoFile) {
    logoUrl = await uploadBrandLogo(input.logoFile, input.slug);
  }

  const payload = {
    name: input.name,
    slug: input.slug,
    website: input.website,
    description: input.description,
    logoUrl,
  };

  const action = input.brandId ? 'update' : 'create';
  const { data } = await callManageBrand({
    action,
    brandId: input.brandId,
    payload,
  });
  return data.brandId;
}

export async function archiveBrand(brandId: string) {
  await callManageBrand({ action: 'archive', brandId, payload: {} });
}

export async function restoreBrand(brandId: string) {
  await callManageBrand({ action: 'update', brandId, payload: { unarchive: true } });
}

export async function fetchBrandOffers(brandId: string) {
  const snap = await getDocs(query(collection(db, Collections.OFFERS), where('brandId', '==', brandId)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
}

export async function fetchTeamInvites() {
  const snap = await getDocs(query(collection(db, Collections.TEAM_INVITES), orderBy('createdAt', 'desc'), limit(50)));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      email: String(data.email ?? ''),
      role: String(data.role ?? 'analyst'),
      status: String(data.status ?? 'pending'),
      full_name: (data.fullName as string | null) ?? null,
      invited_at: toIsoString(data.invitedAt as FirestoreTimestamp) ?? toIsoString(data.createdAt as FirestoreTimestamp) ?? new Date().toISOString(),
      created_at: toIsoString(data.createdAt as FirestoreTimestamp) ?? new Date().toISOString(),
    };
  });
}

/** @deprecated Use fetchTeamInvites */
export const fetchTeamMembers = fetchTeamInvites;

export async function inviteTeamMember(email: string, role: string) {
  await callSendTeamInvite({ email, role });
}

export async function removeStaffMember(userId: string) {
  await callDeleteStaffMember({ userId });
}

export async function fetchSupportTickets() {
  const snap = await getDocs(query(collection(db, Collections.SUPPORT_TICKETS), orderBy('createdAt', 'desc'), limit(100)));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      user_id: (data.userId as string | null) ?? null,
      full_name: String(data.fullName ?? ''),
      student_email: String(data.studentEmail ?? ''),
      subject: String(data.subject ?? ''),
      message: String(data.message ?? ''),
      status: String(data.status ?? 'open'),
      created_at: toIsoString(data.createdAt as FirestoreTimestamp) ?? new Date().toISOString(),
      updated_at: toIsoString(data.updatedAt as FirestoreTimestamp) ?? new Date().toISOString(),
    };
  });
}

export async function updateSupportTicketStatus(ticketId: string, status: string) {
  await updateDoc(doc(db, Collections.SUPPORT_TICKETS, ticketId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function sendSupportTicketReply(input: {
  ticketId: string;
  recipientEmail: string;
  fullName: string;
  subject: string;
  originalMessage: string;
  replyMessage: string;
  agentName?: string;
}) {
  await callSendTransactionalEmail({
    templateName: 'support-reply',
    recipientEmail: input.recipientEmail,
    idempotencyKey: `support-reply-${input.ticketId}-${Date.now()}`,
    templateData: {
      name: input.fullName,
      agentName: input.agentName,
      originalSubject: input.subject,
      originalMessage: input.originalMessage,
      replyMessage: input.replyMessage,
    },
  });
}

export async function fetchAbExperimentStats() {
  const [assignments, events] = await Promise.all([
    getDocs(collection(db, Collections.AB_ASSIGNMENTS)),
    getDocs(collection(db, Collections.AB_EVENTS)),
  ]);
  return {
    assignments: assignments.docs.map((d) => d.data()),
    events: events.docs.map((d) => d.data()),
  };
}

export async function fetchActivityLog(limitCount = 50) {
  const snap = await getDocs(query(collection(db, Collections.ACTIVITY_LOG), orderBy('createdAt', 'desc'), limit(limitCount)));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      actor_id: (data.actorId as string | null) ?? null,
      action: String(data.action ?? ''),
      entity: (data.entity as string | null) ?? null,
      entity_id: (data.entityId as string | null) ?? null,
      summary: String(data.summary ?? ''),
      metadata: (data.metadata as Record<string, unknown>) ?? {},
      created_at: toIsoString(data.createdAt as FirestoreTimestamp) ?? new Date().toISOString(),
    };
  });
}

export async function getUserDisplaySettings(userId: string) {
  const snap = await getDoc(doc(db, Collections.USERS, userId));
  const data = snap.data() as Record<string, unknown> | undefined;
  return {
    display_name: String(data?.displayName ?? ''),
    settings: (data?.settings as Record<string, unknown>) ?? {},
    role: 'student',
  };
}

export async function updateStaffSettings(userId: string, settings: Record<string, unknown>, displayName?: string) {
  await callManageBrand({
    action: 'updateUser',
    payload: { userId, settings, displayName },
  });
}

export { mapBrandDoc };
