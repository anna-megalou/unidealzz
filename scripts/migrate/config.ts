import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT,
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  dryRun: process.env.DRY_RUN === 'true',
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
