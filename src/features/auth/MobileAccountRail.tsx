'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import clsx from 'clsx';

import { supabaseBrowser } from '@/lib/supabase/browser';
import { t, type Dictionary } from '@/i18n/getDictionary';

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

export function MobileAccountRail({
  dict,
  onNavigate,
}: {
  dict: Dictionary;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const localePrefix = detectLocalePrefix(pathname);

  const [email, setEmail] = React.useState<string | null>(null);

  const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
  const loginHref = `${localePrefix}/login${next}`;
  const registerHref = `${localePrefix}/register${next}`;
  const accountHref = `${localePrefix}/account`;
  const wishlistHref = `${localePrefix}/wishlist`;
  const homeHref = `${localePrefix || ''}/`;

  React.useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      setEmail(null);
      return;
    }

    const client = sb;
    let alive = true;

    async function sync() {
      try {
        const { data } = await client.auth.getSession();
        if (!alive) return;
        setEmail(data.session?.user?.email ?? null);
      } catch {
        if (!alive) return;
        setEmail(null);
      }
    }

    void sync();

    const { data: sub } = client.auth.onAuthStateChange(() => void sync());
    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      const sb = supabaseBrowser();
      if (sb) await sb.auth.signOut();
    } finally {
      onNavigate?.();
      router.refresh();
      router.push(homeHref);
    }
  }

  const baseTile =
    'inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm font-semibold shadow-soft transition !no-underline hover:!no-underline';

  const navProps = onNavigate ? { onClick: onNavigate } : {};

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {email ? (
          <Link
            href={accountHref}
            {...navProps}
            className={clsx(baseTile, 'bg-brand-blue text-white')}
          >
            {t(dict, 'nav.account', 'Cuenta')}
          </Link>
        ) : (
          <Link
            href={loginHref}
            {...navProps}
            className={clsx(baseTile, 'bg-brand-blue text-white')}
          >
            {t(dict, 'nav.login', 'Iniciar sesión')}
          </Link>
        )}

        {email ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className={clsx(
              baseTile,
              'border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
            )}
          >
            {t(dict, 'account.logout', 'Cerrar sesión')}
          </button>
        ) : (
          <Link
            href={accountHref}
            {...navProps}
            className={clsx(
              baseTile,
              'border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
            )}
          >
            {t(dict, 'nav.account', 'Cuenta')}
          </Link>
        )}
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <Link
          href={registerHref}
          {...navProps}
          className={clsx(
            baseTile,
            'h-10 border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
          )}
        >
          {t(dict, 'nav.register', 'Crear cuenta')}
        </Link>
        <Link
          href={wishlistHref}
          {...navProps}
          className={clsx(
            baseTile,
            'h-10 border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
          )}
        >
          {t(dict, 'nav.wishlist', 'Wishlist')}
        </Link>
      </div>

      <div className="mt-2 min-h-5 text-xs text-[color:var(--color-text)]/60">
        {email
          ? `${t(dict, 'account.session_active', 'Sesión activa')}: ${email}`
          : t(dict, 'account.quick_access_blurb', 'Login, cuenta y registro siempre visibles también en mobile vertical.')}
      </div>
    </>
  );
}
