// src/lib/adminGuard.ts
import 'server-only';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type AdminGuardOptions = {
  /** URL a donde mandar si no está autorizado */
  redirectTo?: string;
};

/**
 * Guard mínimo para rutas /admin.
 * En P0 lo dejamos "deny-by-default" a menos que exista ADMIN_TOKEN y llegue por header/cookie.
 * Luego en P1/P2 se sustituye por Supabase Auth + roles.
 */
export async function adminGuard(opts: AdminGuardOptions = {}) {
  const redirectTo = opts.redirectTo ?? '/';

  // P0: token simple por env para no dejar /admin abierto por accidente
  const required = (process.env.ADMIN_TOKEN || '').trim();
  if (!required) {
    // Si no configuraste admin, bloquea admin en producción
    if (process.env.NODE_ENV === 'production') redirect(redirectTo);
    return { ok: true as const, mode: 'dev-open' as const };
  }

  // Validación: token por header/cookie
  // Next.js 15+ (App Router): headers()/cookies() can be async depending on runtime,
  // so we always await to keep types stable.
  const h = await headers();
  const c = await cookies();
  const provided = (h.get('x-admin-token') || c.get('admin_token')?.value || '').trim();
  if (!provided || provided !== required) {
    redirect(redirectTo);
  }

  return { ok: true as const, mode: 'token' as const };
}

// Alias para compatibilidad con páginas existentes (/admin/*)
export const requireAdmin = adminGuard;
