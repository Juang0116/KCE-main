'use client';

type ActionTokenPayload = { ok?: boolean; token?: string; exp?: number };

function isMutating(method: string) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

function shouldSkipToken(url: string) {
  return url.includes('/api/admin/auth/login') || url.includes('/api/admin/auth/action-token');
}

function toUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
  // Fallback best-effort (covers edge cases / polyfills)
  return String(input);
}

// IMPORTANT:
// Admin action tokens are **one-time** (anti-replay). Do NOT cache them.
// If you reuse the same token across two mutations, the server will correctly
// reject it as REPLAY and you'll get a 403.
async function mintOneTimeActionToken(): Promise<string> {
  const res = await fetch('/api/admin/auth/action-token', {
    method: 'GET',
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });

  const json = (await res.json().catch(() => ({}))) as ActionTokenPayload;

  if (!res.ok || !json?.token) {
    throw new Error((json as any)?.error || 'No se pudo obtener action token');
  }

  return json.token;
}

/**
 * Use instead of fetch() for /api/admin/* calls from client components.
 */
export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const url = toUrlString(input);
  const method = (init.method || 'GET').toUpperCase();

  const headers = new Headers(init.headers || undefined);

  const isAdminApi = url.includes('/api/admin');

  if (isAdminApi && isMutating(method) && !shouldSkipToken(url)) {
    const token = await mintOneTimeActionToken();
    headers.set('x-kce-action-token', token);
  }

  return fetch(input, { ...init, headers });
}
