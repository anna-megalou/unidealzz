import { config } from './config.js';
import { getSupabase, getAuth } from './utils/clients.js';
import { logStep } from './utils/firestore.js';

const STEP = '03-auth-users';
const IMPORT_BATCH = 1000;

interface SupabaseAuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  phone?: string | null;
  created_at?: string;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

async function listSupabaseUsers(): Promise<SupabaseAuthUser[]> {
  const supabase = getSupabase();
  const users: SupabaseAuthUser[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (!data.users.length) break;
    users.push(...(data.users as SupabaseAuthUser[]));
    if (data.users.length < 1000) break;
    page += 1;
  }

  return users;
}

export async function migrateAuthUsers(): Promise<void> {
  const auth = getAuth();
  const users = await listSupabaseUsers();

  if (config.dryRun) {
    logStep(STEP, 'Dry run — would import auth users', { count: users.length });
    return;
  }

  let imported = 0;

  for (let i = 0; i < users.length; i += IMPORT_BATCH) {
    const chunk = users.slice(i, i + IMPORT_BATCH);
    const result = await auth.importUsers(
      chunk.map((user) => ({
        uid: user.id,
        email: user.email,
        emailVerified: !!user.email_confirmed_at,
        phoneNumber: user.phone ?? undefined,
        displayName:
          (user.user_metadata?.display_name as string | undefined) ??
          (user.user_metadata?.full_name as string | undefined),
        photoURL: user.user_metadata?.avatar_url as string | undefined,
        disabled: false,
        metadata: {
          supabaseCreatedAt: user.created_at ?? null,
          supabaseLastSignInAt: user.last_sign_in_at ?? null,
        },
      })),
    );

    if (result.failureCount > 0) {
      for (const err of result.errors) {
        console.error(`[${STEP}] import error`, err);
      }
    }

    imported += result.successCount;
  }

  logStep(STEP, 'Imported auth users (password hashes not migrated — users must reset passwords)', {
    total: users.length,
    imported,
  });
}

const isMain = process.argv[1]?.includes('03-auth-users');
if (isMain) {
  migrateAuthUsers().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
