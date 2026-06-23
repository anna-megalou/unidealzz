import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function resolveImportPath(
  dataDir: string,
  envValue: string | undefined,
  fallbackFileName: string,
  required = false,
): string | null {
  if (envValue) {
    const filePath = resolve(envValue);
    if (!existsSync(filePath)) {
      throw new Error(`CSV file not found: ${filePath}`);
    }
    return filePath;
  }

  const exactPath = resolve(dataDir, fallbackFileName);
  if (existsSync(exactPath)) {
    return exactPath;
  }

  const baseName = fallbackFileName.replace(/\.csv$/i, '');
  const timestamped = readdirSync(dataDir)
    .filter((name) => name.startsWith(`${baseName}-`) && name.endsWith('.csv'))
    .sort()
    .at(-1);

  if (timestamped) {
    return resolve(dataDir, timestamped);
  }

  if (required) {
    throw new Error(`CSV file not found: ${exactPath}`);
  }

  return null;
}
