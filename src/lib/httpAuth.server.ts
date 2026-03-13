// src/lib/httpAuth.server.ts
import 'server-only';

/**
 * Minimal HTTP Basic Auth helper.
 * Used by RBAC endpoints and optional server-to-server tools.
 */
export function getBasicAuthActor(req: Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;

  const m = auth.match(/^Basic\s+(.+)$/i);
  if (!m) return null;

  const b64 = m[1];
  if (!b64) return null;

  try {
    const raw = Buffer.from(b64, 'base64').toString('utf-8');
    const idx = raw.indexOf(':');
    const user = (idx >= 0 ? raw.slice(0, idx) : raw).trim();
    return user || null;
  } catch {
    return null;
  }
}
