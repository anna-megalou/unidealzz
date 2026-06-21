import { describe, it, expect } from 'vitest';
import { COLLECTIONS, getDefaultUserSettings } from './constants.js';

describe('migration constants', () => {
  it('defines core Firestore collections', () => {
    expect(COLLECTIONS.offers).toBe('offers');
    expect(COLLECTIONS.users).toBe('users');
    expect(COLLECTIONS.experiencePosts).toBe('experiencePosts');
  });

  it('provides default user settings', () => {
    const settings = getDefaultUserSettings();
    expect(settings.currency).toBe('EUR');
    expect(settings.theme).toBe('system');
  });
});

describe('validateMigration', () => {
  it('exports validation helpers from validate module', async () => {
    process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key';

    const mod = await import('./validate.js');
    expect(typeof mod.validateMigration).toBe('function');
    expect(typeof mod.printValidationReport).toBe('function');
  });
});
