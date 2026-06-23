import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { getSupabase, getAuth } from './utils/clients.js';
import {
  emptyToNull,
  parseJsonObjectField,
  readSemicolonCsv,
} from './utils/csv.js';
import { resolveImportPath } from './utils/csvPaths.js';
import { logStep } from './utils/firestore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const STEP = '03-auth-users';
const IMPORT_BATCH = 1000;

interface AuthUserRecord {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  phone?: string | null;
  created_at?: string;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown>;
}

function mapCsvRow(row: Record<string, string>): AuthUserRecord {
  const metadata =
    parseJsonObjectField(row.raw_user_meta_data ?? row.user_metadata ?? '') ??
    parseJsonObjectField(row.raw_app_meta_data ?? row.app_metadata ?? '') ??
    {};

  return {
    id: row.id,
    email: emptyToNull(row.email) ?? undefined,
    email_confirmed_at: emptyToNull(row.email_confirmed_at),
    phone: emptyToNull(row.phone),
    created_at: emptyToNull(row.created_at) ?? undefined,
    last_sign_in_at: emptyToNull(row.last_sign_in_at),
    user_metadata: metadata,
  };
}

function resolveAuthUsersCsvPath(): string | null {
  return resolveImportPath(DATA_DIR, process.env.CSV_AUTH_USERS, 'auth_users-export.csv');
}

async function listSupabaseUsers(): Promise<AuthUserRecord[]> {
  const supabase = getSupabase();
  const users: AuthUserRecord[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (!data.users.length) break;
    users.push(...(data.users as AuthUserRecord[]));
    if (data.users.length < 1000) break;
    page += 1;
  }

  return users;
}

function listAuthUsersFromCsv(): AuthUserRecord[] {
  const csvPath = resolveAuthUsersCsvPath();
  if (!csvPath) {
    throw new Error(
      'AUTH_USERS_SOURCE=csv but no auth users CSV found. ' +
        'Export auth.users from Supabase and save as data/auth_users-export.csv, ' +
        'or set CSV_AUTH_USERS to the file path.',
    );
  }

  const rows = readSemicolonCsv(csvPath).filter((row) => row.id?.trim());
  logStep(STEP, 'Loaded auth users from CSV', { path: csvPath, count: rows.length });
  return rows.map(mapCsvRow);
}

async function loadAuthUsers(): Promise<AuthUserRecord[]> {
  const source = process.env.AUTH_USERS_SOURCE?.toLowerCase();
  const csvPath = resolveAuthUsersCsvPath();

  if (source === 'csv' || csvPath) {
    return listAuthUsersFromCsv();
  }

  return listSupabaseUsers();
}

export async function migrateAuthUsers(): Promise<void> {
  const auth = getAuth();
  const users = await loadAuthUsers();

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
