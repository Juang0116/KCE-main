// src/lib/supabase/browser.ts
'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type NetEventDetail = {
  kind: 'offline' | 'timeout' | 'fetch_failed';
  url?: string;
  message?: string;
};

function emitNetEvent(detail: NetEventDetail) {
  try {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('kce:net', { detail }));
  } catch {
    // noop
  }
}

/**
 * Supabase Auth (auth-js) refresca tokens en background.
 * Cuando hay problemas de red (Cloudflare 522, DNS/SSL, offline), el fetch nativo
 * puede lanzar TypeError("Failed to fetch") y llenar la consola con stack traces.
 *
 * Este wrapper convierte fallos de red en una Response JSON (status 59x),
 * para que auth-js lo trate como error HTTP manejable (sin TypeError).
 */
async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : undefined;

  // Si el navegador reporta offline, fallamos rápido.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    emitNetEvent({ kind: 'offline', ...(url ? { url } : {}) });
    return new Response(JSON.stringify({ message: 'offline' }), {
      status: 599,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Timeout suave para evitar cuelgues eternos en redes inestables.
  const timeoutMs = 12_000;
  const controller = new AbortController();

  // Si ya viene un signal desde init, lo respetamos (no lo pisamos).
  const userSignal = init?.signal;
  const hasUserSignal = userSignal !== undefined;
  const signal: AbortSignal | null = hasUserSignal ? userSignal : controller.signal;
  const t = hasUserSignal
    ? null
    : setTimeout(() => {
        try {
          controller.abort();
          emitNetEvent({
            kind: 'timeout',
            ...(url ? { url } : {}),
            message: `timeout_${timeoutMs}ms`,
          });
        } catch {
          // noop
        }
      }, timeoutMs);

  try {
    const res = await fetch(input, {
      ...init,
      signal,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    emitNetEvent({ kind: 'fetch_failed', ...(url ? { url } : {}), message });

    if (process.env.NODE_ENV !== 'production') {
      // Log corto (sin stack enorme) para debug.
      console.warn('[supabaseBrowser] network fetch failed:', message);
    }

    return new Response(JSON.stringify({ message: 'fetch_failed', error: message }), {
      status: 599,
      headers: { 'content-type': 'application/json' },
    });
  } finally {
    if (t) clearTimeout(t);
  }
}

function normalizeUrl(v: string) {
  const s = (v ?? '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) return '';
  return s.length >= 10 ? s : '';
}

function normalizeAnon(v: string) {
  const s = (v ?? '').trim();
  // Legacy anon JWT suele ser largo (eyJ...). Umbral razonable.
  return s.length >= 80 ? s : '';
}

// IMPORTANTE (Next.js):
// En client components, las variables NEXT_PUBLIC_* se inyectan en build-time
// SOLO si se accede a ellas de forma estática (process.env.NEXT_PUBLIC_...).
function getPublicEnv() {
  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
  const anon = normalizeAnon(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '');
  return { url, anon };
}

function devDiag(url: string, anon: string) {
  if (process.env.NODE_ENV === 'production') return;

  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anon) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length) {
    console.warn('[supabaseBrowser] Missing public env:', missing.join(', '));
    console.warn(
      '[supabaseBrowser] Revisa .env.local (raíz del proyecto) y reinicia: rm -rf .next && npm run dev',
    );
    console.warn(
      '[supabaseBrowser] Si tienes env del sistema configuradas (Windows), asegúrate de que NO estén vacías (Next no las override).',
    );
  }
}

let _sb: SupabaseClient | null = null;

export function isSupabaseBrowserConfigured() {
  const { url, anon } = getPublicEnv();
  return Boolean(url && anon);
}

export function supabaseBrowser() {
  const { url, anon } = getPublicEnv();

  devDiag(url, anon);

  // Si no hay env, NO tumbes la UI: devolvemos null y el feature se desactiva.
  if (!url || !anon) return null;

  // Singleton: evita recrear el cliente en cada render
  if (_sb) return _sb;

  _sb = createClient(url, anon, {
    global: {
      fetch: safeFetch,
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // @ts-expect-error - some auth-js builds accept custom fetch at runtime
      fetch: safeFetch,
    },
  });

  return _sb;
}
