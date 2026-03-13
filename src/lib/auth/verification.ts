// src/lib/auth/verification.ts

/**
 * Supabase user objects can expose different fields depending on SDK versions.
 * We treat any non-null confirmation timestamp as verified.
 */
export function isEmailVerified(user: any): boolean {
  if (!user) return false;
  const ts = (user as any).email_confirmed_at ?? (user as any).confirmed_at;
  if (typeof ts === 'string' && ts.trim()) return true;
  if (ts instanceof Date) return true;

  // Some setups store email_verified in user metadata
  const meta = (user as any).user_metadata;
  if (meta && typeof meta.email_verified === 'boolean') return meta.email_verified;

  return false;
}
