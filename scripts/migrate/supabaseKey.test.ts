import { describe, expect, it } from 'vitest';
import { assertServiceRoleKey, getSupabaseKeyRole } from './utils/supabaseKey.js';

const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteGtvdnVlZ3BiZHFmb3FtZ2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTEzODgsImV4cCI6MjA5MjIyNzM4OH0.test';

describe('supabaseKey', () => {
  it('detects anon keys', () => {
    expect(getSupabaseKeyRole(anonKey)).toBe('anon');
    expect(() => assertServiceRoleKey(anonKey)).toThrow(/anon \(public\) key/);
  });

  it('rejects placeholder keys', () => {
    expect(() => assertServiceRoleKey('your-service-role-key')).toThrow(/placeholder/);
  });
});
