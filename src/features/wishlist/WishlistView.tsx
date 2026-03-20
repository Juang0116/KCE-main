'use client';

import Link from 'next/link';
import * as React from 'react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { isEmailVerified } from '@/lib/auth/verification';

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

type Item = {
  id: string;
  created_at: string;
  tours: {
    id: string;
    slug: string;
    title: string;
    city: string | null;
    base_price: number | null;
    images: any;
  } | null;
};

export default function WishlistView() {
  const pathname = usePathname() || '/';
  const localePrefix = detectLocalePrefix(pathname);
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<Item[]>([]);
  const [signedIn, setSignedIn] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [needsVerify, setNeedsVerify] = React.useState(false);
  const [verifyEmail, setVerifyEmail] = React.useState<string>('');
  const [token, setToken] = React.useState<string>('');
  const [busyId, setBusyId] = React.useState<string>('');

  const inFlight = React.useRef(false);
  const lastLoadAt = React.useRef(0);

  async function load() {
    // Avoid reload storms (Strict Mode double-invoke in dev, noisy auth events, etc.)
    if (inFlight.current) return;
    const now = Date.now();
    if (now - lastLoadAt.current < 500) return;
    lastLoadAt.current = now;
    inFlight.current = true;

    try {
      setLoading(true);
      setMsg('');

      const sb = supabaseBrowser();
      if (!sb) {
        setSignedIn(false);
        setItems([]);
        setMsg('Auth no configurado. Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        return;
      }

      const { data, error } = await sb.auth.getSession();
      if (error) {
        setSignedIn(false);
        setItems([]);
        setMsg('No se pudo leer la sesión. Intenta de nuevo.');
        return;
      }

      const token = data.session?.access_token ?? '';
      setToken(token);
      setNeedsVerify(false);
      setVerifyEmail('');

      setSignedIn(Boolean(token));
      if (!token) {
        setItems([]);
        return;
      }

      // If email verification is required, block wishlist until confirmed.
      try {
        const { data: u } = await sb.auth.getUser();
        if (u?.user && !isEmailVerified(u.user)) {
          setNeedsVerify(true);
          setVerifyEmail(String(u.user.email ?? ''));
          setItems([]);
          return;
        }
      } catch {
        // If this fails, let the API respond.
      }

      const res = await fetch('/api/wishlist', {
        headers: { authorization: `Bearer ${token}` },
      });

      const out = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setMsg(`Demasiadas solicitudes. Espera ${Math.max(1, Number(out?.retryAfterSeconds ?? 5))}s y vuelve a intentar.`);
        setItems([]);
        return;
      }

      if (res.status === 403 && out?.errorCode === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerify(true);
        setVerifyEmail(String(out?.email ?? ''));
        setItems([]);
        return;
      }

      if (!res.ok || !out.ok) throw new Error('bad');
      setItems(Array.isArray(out.items) ? out.items : []);
    } catch {
      setMsg('No pudimos cargar tus favoritos.');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  React.useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      await load();

      const sb = supabaseBrowser();
      if (!sb) return;

      const { data } = sb.auth.onAuthStateChange(() => {
        void load();
      });

      unsub = () => data.subscription.unsubscribe();
    })();

    return () => {
      unsub?.();
    };
  }, []);

  async function removeItem(it: Item) {
    const tid = it?.tours?.id ?? null;
    const slug = it?.tours?.slug ?? null;

    if (!token) {
      window.location.href = `${localePrefix}/login?next=${encodeURIComponent(`${localePrefix}/wishlist`)}`;
      return;
    }
    if (!tid && !slug) return;

    setBusyId(it.id);
    setMsg('');

    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tourId: tid ?? undefined, tourSlug: slug ?? undefined }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (json?.code === 'EMAIL_NOT_VERIFIED') {
          setNeedsVerify(true);
          setVerifyEmail(String(json?.email ?? ''));
          return;
        }
        setMsg(json?.message ? String(json.message) : 'No se pudo quitar de la wishlist.');
        return;
      }

      // Optimistic update
      setItems((prev) => prev.filter((p) => p.id !== it.id));
    } catch (e: any) {
      setMsg('Problema de red. Intenta de nuevo.');
    } finally {
      setBusyId('');
    }
  }

  if (!signedIn) {
    const next = encodeURIComponent(`${localePrefix}/wishlist`);
    return (
      <div className="card p-6">
        <h2 className="font-heading text-xl text-brand-blue">Tus favoritos</h2>
        <p className="text-[color:var(--color-text)]/75 mt-2">
          Para guardar y ver tu wishlist, inicia sesión con tu cuenta (contraseña o enlace mágico).
        </p>
        <div className="mt-4">
          <Button
            asChild
            variant="primary"
          >
            <Link href={`${localePrefix}/login?next=${next}`}>Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl text-brand-blue">Tus favoritos</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          isLoading={loading}
        >
          Actualizar
        </Button>
      </div>

      {needsVerify ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-100">
          <div className="font-semibold">Verifica tu correo para usar la wishlist</div>
          <div className="mt-1 text-sm text-amber-950/80 dark:text-amber-100/85">
            Te enviamos un correo de verificación{verifyEmail ? ` a ${verifyEmail}` : ''}. Abre el
            enlace para activar tu cuenta.
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="primary"
            >
              <Link
                href={`${localePrefix}/verify-email?email=${encodeURIComponent(verifyEmail)}&next=${encodeURIComponent(`${localePrefix}/wishlist`)}`}
              >
                Reenviar verificación
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
            >
              <Link
                href={`${localePrefix}/login?next=${encodeURIComponent(`${localePrefix}/wishlist`)}`}
              >
                Volver a login
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? <p className="text-[color:var(--color-text)]/70 mt-4">Cargando…</p> : null}
      {msg ? <p className="mt-4 text-red-600 dark:text-red-200">{msg}</p> : null}

      {!loading && !msg && items.length === 0 ? (
        <p className="text-[color:var(--color-text)]/70 mt-4">Aún no tienes tours guardados.</p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items
          .filter((i) => i.tours)
          .map((i) => (
            <div
              key={i.id}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 hover:shadow-pop"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`${localePrefix}/tours/${i.tours!.slug}`}
                  className="block min-w-0 flex-1 no-underline hover:no-underline"
                >
                  <div className="text-lg font-semibold text-[color:var(--color-text)]">
                    {i.tours!.title}
                  </div>
                  <div className="text-[color:var(--color-text)]/70 mt-1 text-sm">
                    {i.tours!.city ?? 'Colombia'}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-brand-blue">Ver tour →</div>
                </Link>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void removeItem(i)}
                  disabled={busyId === i.id}
                  isLoading={busyId === i.id}
                >
                  Quitar
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
