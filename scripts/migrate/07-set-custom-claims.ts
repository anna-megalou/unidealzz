import type { Role } from './constants.js';
import { config } from './config.js';
import { getAuth, getFirestore } from './utils/clients.js';
import { COLLECTIONS } from './constants.js';
import { logStep } from './utils/firestore.js';

const STEP = '07-set-custom-claims';
const VALID_ROLES = new Set<Role>(['admin', 'student', 'curator', 'analyst']);

export async function setCustomClaims(): Promise<void> {
  const db = getFirestore();
  const auth = getAuth();

  const rolesSnap = await db.collection(COLLECTIONS.userRoles).get();
  const rolesByUser = new Map<string, Role[]>();

  for (const doc of rolesSnap.docs) {
    const data = doc.data();
    const userId = data.userId as string | undefined;
    const role = data.role as Role | undefined;
    if (!userId || !role || !VALID_ROLES.has(role)) continue;

    const existing = rolesByUser.get(userId) ?? [];
    if (!existing.includes(role)) {
      existing.push(role);
    }
    rolesByUser.set(userId, existing);
  }

  if (config.dryRun) {
    logStep(STEP, 'Dry run — would set custom claims', { users: rolesByUser.size });
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const [userId, roles] of rolesByUser) {
    try {
      await auth.getUser(userId);
      await auth.setCustomUserClaims(userId, { roles });
      updated += 1;
    } catch {
      skipped += 1;
      console.warn(`[${STEP}] Skipped missing auth user ${userId}`);
    }
  }

  logStep(STEP, 'Set custom claims from userRoles', { updated, skipped });
}

const isMain = process.argv[1]?.includes('07-set-custom-claims');
if (isMain) {
  setCustomClaims().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
