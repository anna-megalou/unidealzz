import { readFileSync } from 'node:fs';

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

export function parseSemicolonCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0], ';');
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = parseCsvLine(line, ';');
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return row;
  });
}

export function readSemicolonCsv(filePath: string): Record<string, string>[] {
  const content = readFileSync(filePath, 'utf8');
  return parseSemicolonCsv(content);
}

export function parseJsonArrayField(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null') return [];

  try {
    const normalized = trimmed.replace(/""/g, '"');
    const parsed = JSON.parse(normalized) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function emptyToNull(value: string): string | null {
  return value.trim() === '' ? null : value.trim();
}
