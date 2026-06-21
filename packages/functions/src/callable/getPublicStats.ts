import { onCall } from 'firebase-functions/v2/https';
import { COLLECTIONS } from '@unidealz/shared';
import { CALLABLE_CONFIG } from '../config';
import { db } from '../admin';

/** Public stats (replaces get_registered_students_count RPC). */
export const getPublicStats = onCall(CALLABLE_CONFIG, async () => {
  const countSnap = await db.collection(COLLECTIONS.profiles).count().get();
  return { registeredStudentsCount: countSnap.data().count };
});
