// src/lib/sanitize.ts
/**
 * Minimal sanitization utilities for user-provided text.
 * Goal: prevent HTML injection and keep payload sizes bounded.
 */
export function sanitizeText(input: unknown, maxLen = 2000): string {
  const s = typeof input === 'string' ? input : '';
  // Escape only the critical angle brackets; we render content as plain text in most places.
  const escaped = s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.trim().slice(0, maxLen);
}

export function sanitizeTitle(input: unknown, maxLen = 120): string {
  return sanitizeText(input, maxLen);
}
