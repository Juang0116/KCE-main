import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Next.js 15 can type `cookies()` as returning a Promise in some server contexts.
// Keep this helper async so TypeScript builds pass.
export async function supabaseServer() {
  // Next 15 types can surface `cookies()` as returning a Promise in some contexts.
  // We `await` it for runtime correctness and then cast to avoid strict-type drift.
  const cookieStore = (await cookies()) as any;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY on server');
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        // `cookieStore` comes from Next's request cookies store.
        // Some Next.js typings drift across versions; keep this defensive.
        return cookieStore.getAll?.() ?? [];
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>,
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // En algunos contextos RSC puede fallar setear cookies.
          // En Route Handlers (como /auth/callback) sí aplica perfecto.
        }
      },
    },
  });
}
