/* src/components/admin/checkoutPreset.ts */

export type CheckoutPreset = {
  lastSlug?: string;
  lastDate?: string; // YYYY-MM-DD
  lastGuests?: number;
};

const KEY = 'kce.admin.checkoutPreset.v1';

export function loadCheckoutPreset(): CheckoutPreset {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const j = JSON.parse(raw) as CheckoutPreset;
    return j && typeof j === 'object' ? j : {};
  } catch {
    return {};
  }
}

export function saveCheckoutPreset(p: CheckoutPreset) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p || {}));
  } catch {
    // ignore
  }
}

export function ymdPlusDays(days: number) {
  const dt = new Date();
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + (Number.isFinite(days) ? days : 0));
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
