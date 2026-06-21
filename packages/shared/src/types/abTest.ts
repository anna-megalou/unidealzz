import type { FirestoreTimestamp, Json } from './common';

export interface AbAssignment {
  id: string;
  experimentKey: string;
  variant: string;
  userId: string | null;
  anonId: string | null;
  createdAt: FirestoreTimestamp;
}

export interface AbEvent {
  id: string;
  experimentKey: string;
  variant: string;
  eventType: string;
  userId: string | null;
  anonId: string | null;
  metadata: Json;
  createdAt: FirestoreTimestamp;
}

export interface ActivityLog {
  id: string;
  action: string;
  summary: string;
  actorId: string | null;
  entity: string | null;
  entityId: string | null;
  metadata: Json;
  createdAt: FirestoreTimestamp;
}
