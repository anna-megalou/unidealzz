import type { FirestoreTimestamp } from './common';

export interface University {
  id: string;
  name: string;
  shortCode: string;
  allowedDomains: string[];
  createdAt: FirestoreTimestamp;
}
