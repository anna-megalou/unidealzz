import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { STAFF_ROLES, type Role } from '@unidealz/shared';
import { hasRole } from '../services/role/roleCore';
import { requireAuth } from './requireAllowedUser';

export async function requireAdmin(request: CallableRequest): Promise<string> {
  const uid = requireAuth(request);
  const isAdmin = await hasRole(uid, 'admin');
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Admin role required');
  }
  return uid;
}

export async function requireStaff(request: CallableRequest): Promise<string> {
  const uid = requireAuth(request);
  for (const role of STAFF_ROLES) {
    if (await hasRole(uid, role as Role)) {
      return uid;
    }
  }
  throw new HttpsError('permission-denied', 'Staff role required');
}
