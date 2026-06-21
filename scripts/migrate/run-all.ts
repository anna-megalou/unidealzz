import { isStepComplete, markStepComplete, readCheckpoint } from './utils/checkpoint.js';
import { migrateReferenceData } from './01-reference-data.js';
import { migrateOffers } from './02-offers.js';
import { migrateAuthUsers } from './03-auth-users.js';
import { migrateUserData } from './04-user-data.js';
import { migrateExperiences } from './05-experiences.js';
import { migrateOperationsData } from './06-operations-data.js';
import { setCustomClaims } from './07-set-custom-claims.js';
import { validateMigration, printValidationReport } from './validate.js';

interface MigrationStep {
  id: string;
  label: string;
  run: () => Promise<void>;
}

const STEPS: MigrationStep[] = [
  { id: '01-reference-data', label: 'Reference data', run: migrateReferenceData },
  { id: '02-offers', label: 'Offers', run: migrateOffers },
  { id: '03-auth-users', label: 'Auth users', run: migrateAuthUsers },
  { id: '04-user-data', label: 'User data', run: migrateUserData },
  { id: '05-experiences', label: 'Experiences + storage', run: migrateExperiences },
  { id: '06-operations-data', label: 'Operations data', run: migrateOperationsData },
  { id: '07-set-custom-claims', label: 'Custom claims', run: setCustomClaims },
];

async function main() {
  const checkpoint = readCheckpoint();
  console.log('Starting migration orchestrator');
  console.log('Checkpoint:', checkpoint);

  for (const step of STEPS) {
    if (isStepComplete(step.id)) {
      console.log(`Skipping ${step.id} (already complete)`);
      continue;
    }

    console.log(`\n▶ Running ${step.id}: ${step.label}`);
    await step.run();
    markStepComplete(step.id);
    console.log(`✓ Completed ${step.id}`);
  }

  console.log('\n▶ Running validation');
  const results = await validateMigration();
  printValidationReport(results);

  if (results.some((r) => !r.match)) {
    process.exit(1);
  }
}

const isMain = process.argv[1]?.includes('run-all');
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
