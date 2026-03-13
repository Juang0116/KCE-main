/*src/app/auth/callback/page.tsx*/
'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { supabaseBrowser } from '@/lib/supabase/browser';

function safeNextPath(nextParam: string | null, fallback: string) {
  const n = (nextParam ?? '').trim();
  if (!n) return fallback;
  // Evita open-redirects
  if (!n.startsWith('/') || n.startsWith('//')) return fallback;
  return n;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = React.useState('Procesando…');

  React.useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        if (!supabase) {
          setMsg(
            'Configuración de autenticación no disponible. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.',
          );
          return;
        }

        // PKCE flow: intercambia ?code= por sesión y guarda en storage/cookies.
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;

        const url = new URL(window.location.href);
        const next = safeNextPath(url.searchParams.get('next'), '/wishlist');

        setMsg('Sesión iniciada. Redirigiendo…');
        router.replace(next);
      } catch {
        setMsg('No pudimos completar el inicio de sesión. Intenta de nuevo.');
      }
    })();
  }, [router]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="card p-6">
        <h1 className="font-heading text-2xl text-brand-blue">Autenticación</h1>
        <p className="text-[color:var(--color-text)]/75 mt-3">{msg}</p>
      </div>
    </div>
  );
}
