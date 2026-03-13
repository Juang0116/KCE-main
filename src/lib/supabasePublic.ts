import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { publicEnv } from '@/lib/env';

import type { Database } from '@/types/supabase';

type Meta = { url: string; anon: string };

declare global {
  // eslint-disable-next-line no-var
  var __kce_sb_public__: unknown | undefined;
  // eslint-disable-next-line no-var
  var __kce_sb_public_meta__: Meta | undefined;
}

function readPublic(key: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'): string {
  // Prioriza env parseada por Zod (publicEnv) y cae a process.env si hace falta
  const fromZod = publicEnv[key];
  const fromProcess = (process.env as Record<string, string | undefined>)[key];
  return (fromZod ?? fromProcess ?? '').trim();
}

export function isSupabasePublicConfigured(): boolean {
  const url = readPublic('NEXT_PUBLIC_SUPABASE_URL');
  const anon = readPublic('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anon) return false;
  if (/XXXXXX|example|your\-project/i.test(url)) return false;
  if (anon.length < 20) return false;

  return true;
}

export function getSupabasePublic(): SupabaseClient<Database> {
  const url = readPublic('NEXT_PUBLIC_SUPABASE_URL');
  const anon = readPublic('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anon) {
    throw new Error(
      '[supabasePublic] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  const meta: Meta = { url, anon };

  if (
    globalThis.__kce_sb_public__ &&
    globalThis.__kce_sb_public_meta__?.url === meta.url &&
    globalThis.__kce_sb_public_meta__?.anon === meta.anon
  ) {
    return globalThis.__kce_sb_public__ as SupabaseClient<Database>;
  }

  // Evita caching implícito en Next
  const serverFetch: typeof fetch = (input, init) => {
    // Un health-check o query puede colgarse si hay problemas de red/DNS.
    // Agregamos un timeout corto para que la app degrade elegante.
    const controller = new AbortController();
    // En Vercel/Edge algunas revalidaciones pueden tardar más de 4.5s.
    // Un timeout demasiado agresivo genera AbortError y ruido en logs.
    const timeoutMs = 12_000;
    const t = setTimeout(() => controller.abort(), timeoutMs);

    const nextInit: RequestInit = {
      ...(init ?? {}),
      cache: 'no-store',
      signal: controller.signal,
    };

    return fetch(input, nextInit).finally(() => clearTimeout(t));
  };

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: serverFetch, headers: { 'X-Client-Info': 'kce-web/0.2.0 (public)' } },
  });

  globalThis.__kce_sb_public__ = client as unknown;
  globalThis.__kce_sb_public_meta__ = meta;

  return client;
}

export function getSupabasePublicOptional(): SupabaseClient<Database> | null {
  if (!isSupabasePublicConfigured()) return null;
  try {
    return getSupabasePublic();
  } catch {
    return null;
  }
}
