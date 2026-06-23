import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLLECTIONS } from './constants.js';
import { getFirestore } from './utils/clients.js';
import { emptyToNull, parseJsonArrayField, readSemicolonCsv } from './utils/csv.js';
import { logStep, toIso, writeBatch } from './utils/firestore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STEP = 'import-csv';
const DATA_DIR = resolve(__dirname, 'data');

type ImportPaths = {
  universities: string;
  userRoles: string;
  abAssignments: string;
};

function resolveImportPath(value: string | undefined, fallbackFileName: string): string {
  const filePath = resolve(value ?? resolve(DATA_DIR, fallbackFileName));
  if (!existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }
  return filePath;
}

function getImportPaths(): ImportPaths {
  return {
    universities: resolveImportPath(
      process.env.CSV_UNIVERSITIES,
      'universities-export.csv',
    ),
    userRoles: resolveImportPath(process.env.CSV_USER_ROLES, 'user_roles-export.csv'),
    abAssignments: resolveImportPath(
      process.env.CSV_AB_ASSIGNMENTS,
      'ab_assignments-export.csv',
    ),
  };
}

export async function importCsvData(paths: ImportPaths = getImportPaths()): Promise<void> {
  const universities = readSemicolonCsv(paths.universities);
  const userRoles = readSemicolonCsv(paths.userRoles);
  const abAssignments = readSemicolonCsv(paths.abAssignments);

  const items = [
    ...universities.map((row) => ({
      collection: COLLECTIONS.universities,
      id: row.id,
      data: {
        name: row.name,
        shortCode: row.short_code,
        allowedDomains: parseJsonArrayField(row.allowed_domains),
        createdAt: toIso(row.created_at),
      },
    })),
    ...userRoles.map((row) => ({
      collection: COLLECTIONS.userRoles,
      id: row.id,
      data: {
        userId: row.user_id,
        role: row.role,
        createdAt: toIso(row.created_at),
      },
    })),
    ...abAssignments.map((row) => ({
      collection: COLLECTIONS.abAssignments,
      id: row.id,
      data: {
        experimentKey: row.experiment_key,
        variant: row.variant,
        userId: emptyToNull(row.user_id),
        anonId: emptyToNull(row.anon_id),
        createdAt: toIso(row.created_at),
      },
    })),
  ];

  const dryRun = process.env.DRY_RUN === 'true';
  if (dryRun) {
    logStep(STEP, 'Dry run — would write CSV data', {
      universities: universities.length,
      userRoles: userRoles.length,
      abAssignments: abAssignments.length,
      total: items.length,
    });
    return;
  }

  const db = getFirestore();
  const batchSize = Number(process.env.MIGRATE_BATCH_SIZE ?? '400');
  const written = await writeBatch(db, items, batchSize);

  logStep(STEP, 'Imported CSV data to Firestore', {
    universities: universities.length,
    userRoles: userRoles.length,
    abAssignments: abAssignments.length,
    written,
  });
}

const isMain = process.argv[1]?.includes('import-csv');
if (isMain) {
  importCsvData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
