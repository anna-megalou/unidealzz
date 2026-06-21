import type { Firestore } from 'firebase-admin/firestore';

export function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

export function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  return toIso(value);
}

export function mapTheme(theme: unknown): 'light' | 'dark' | 'system' {
  const t = String(theme ?? 'system').toLowerCase();
  if (t === 'dark') return 'dark';
  if (t === 'light') return 'light';
  return 'system';
}

export function mapTimezone(timezone: unknown): string {
  const tz = String(timezone ?? 'Europe/Athens');
  if (tz === 'europe-athens') return 'Europe/Athens';
  return tz;
}

export function mapCurrency(currency: unknown): string {
  return String(currency ?? 'EUR').toUpperCase();
}

export async function writeBatch(
  db: Firestore,
  items: Array<{ collection: string; id: string; data: Record<string, unknown> }>,
  batchSize = 400,
): Promise<number> {
  let written = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const batch = db.batch();
    for (const item of chunk) {
      batch.set(db.collection(item.collection).doc(item.id), item.data, { merge: true });
    }
    await batch.commit();
    written += chunk.length;
  }

  return written;
}

export async function fetchAllRows<T extends Record<string, unknown>>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: Error | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await fetchPage(from, to);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

export function logStep(step: string, message: string, extra?: Record<string, unknown>) {
  const suffix = extra ? ` ${JSON.stringify(extra)}` : '';
  console.log(`[${step}] ${message}${suffix}`);
}
