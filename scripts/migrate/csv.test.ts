import { describe, expect, it } from 'vitest';
import { emptyToNull, parseJsonArrayField, parseSemicolonCsv } from './utils/csv.js';

describe('csv utils', () => {
  it('parses semicolon-delimited rows with quoted fields', () => {
    const rows = parseSemicolonCsv(
      'id;name;allowed_domains\n' +
        '1;University of Patras;"[""upatras.gr"",""upnet.gr""]"',
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('1');
    expect(rows[0].name).toBe('University of Patras');
    expect(parseJsonArrayField(rows[0].allowed_domains)).toEqual(['upatras.gr', 'upnet.gr']);
  });

  it('normalizes empty optional fields to null', () => {
    expect(emptyToNull('')).toBeNull();
    expect(emptyToNull('abc')).toBe('abc');
  });
});
