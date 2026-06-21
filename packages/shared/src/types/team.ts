import type { Role } from '../constants/roles';
import type { FirestoreTimestamp } from './common';

export type TeamInviteStatus = 'pending' | 'accepted' | 'revoked' | string;

export interface TeamInvite {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  status: TeamInviteStatus;
  invitedBy: string | null;
  invitedAt: FirestoreTimestamp;
  acceptedAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface UserRole {
  id: string;
  userId: string;
  role: Role;
  createdAt: FirestoreTimestamp;
}
