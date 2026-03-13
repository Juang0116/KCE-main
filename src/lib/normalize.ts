// src/lib/normalize.ts

export function normalizeEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  return s ? s : null;
}

/**
 * Very lightweight phone normalization (keeps leading +, strips spaces/()/-).
 * Do NOT treat as E.164 validation; it's only to make search + dedupe practical.
 */
export function normalizePhone(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  let s = v.trim();
  if (!s) return null;
  const hasPlus = s.startsWith('+');
  s = s.replace(/[\s()\-]/g, '');
  if (hasPlus && !s.startsWith('+')) s = `+${s}`;
  return s || null;
}

export function normalizeCommaTags(v: unknown): string[] {
  if (typeof v !== 'string') return [];
  return v
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 50);
}
