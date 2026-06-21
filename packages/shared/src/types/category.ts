import type { FirestoreTimestamp } from './common';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  createdAt: FirestoreTimestamp;
}
