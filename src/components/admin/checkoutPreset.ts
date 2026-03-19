/**
 * CheckoutPreset: Persistencia local para agilizar pruebas y 
 * operaciones repetitivas en el panel de administración.
 */

export type CheckoutPreset = {
  lastSlug?: string;
  lastDate?: string;    // Formato ISO: YYYY-MM-DD
  lastGuests?: number;  // Por defecto suele ser 1 o 2
};

const KEY = 'kce.admin.checkout.v1';

/**
 * Carga la configuración guardada del administrador.
 */
export function loadCheckoutPreset(): CheckoutPreset {
  if (typeof window === 'undefined') return {};
  
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    
    const data = JSON.parse(raw);
    
    // Validación básica de estructura
    return {
      lastSlug: typeof data.lastSlug === 'string' ? data.lastSlug : undefined,
      lastDate: typeof data.lastDate === 'string' ? data.lastDate : undefined,
      lastGuests: typeof data.lastGuests === 'number' ? data.lastGuests : undefined,
    };
  } catch (error) {
    console.warn('[CheckoutPreset] Error al leer localStorage:', error);
    return {};
  }
}

/**
 * Guarda la última configuración utilizada.
 */
export function saveCheckoutPreset(p: CheckoutPreset): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = loadCheckoutPreset();
    const next = { ...current, ...p };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    // Silencioso en producción, pero útil para debugear cuotas de almacenamiento
  }
}

/**
 * Genera una fecha en formato YYYY-MM-DD sumando días a la fecha actual.
 * Ideal para pre-seleccionar fechas de tours en el futuro cercano.
 */
export function ymdPlusDays(days: number = 0): string {
  const dt = new Date();
  
  // Normalizamos a medianoche local para evitar saltos inesperados por horas
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + days);

  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  
  return `${y}-${m}-${d}`;
}

/**
 * Limpia los presets si es necesario (ej: al cerrar sesión).
 */
export function clearCheckoutPreset(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}