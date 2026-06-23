import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertServiceRoleKey } from './utils/supabaseKey.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filename: string) {
  const path = resolve(__dirname, filename);
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env.local');

export function configureFirebaseCredentials(): void {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';

  if (useEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    return;
  }

  if (!credentialsPath || credentialsPath.includes('/path/to/')) {
    throw new Error(
      'Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path, ' +
        'or set USE_FIREBASE_EMULATOR=true to import into the local Firestore emulator.',
    );
  }

  if (!existsSync(credentialsPath)) {
    throw new Error(`GOOGLE_APPLICATION_CREDENTIALS file not found: ${credentialsPath}`);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function requireSupabaseConfig(): { url: string; serviceRoleKey: string } {
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  assertServiceRoleKey(serviceRoleKey);
  return {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey,
  };
}

export const config = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT,
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  dryRun: process.env.DRY_RUN === 'true',
  useEmulator: process.env.USE_FIREBASE_EMULATOR === 'true',
  batchSize: Number(process.env.MIGRATE_BATCH_SIZE ?? '400'),
  checkpointFile: resolve(__dirname, process.env.CHECKPOINT_FILE ?? '.migrate-checkpoint.json'),
  experienceStorageBucket: process.env.FIREBASE_EXPERIENCE_BUCKET ?? 'experience-images',
  supabaseExperienceBucket: process.env.SUPABASE_EXPERIENCE_BUCKET ?? 'experience-images',
} as const;

export function assertFirebaseProjectId(): string {
  if (!config.firebaseProjectId) {
    throw new Error('Set FIREBASE_PROJECT_ID or GCLOUD_PROJECT');
  }
  return config.firebaseProjectId;
}
