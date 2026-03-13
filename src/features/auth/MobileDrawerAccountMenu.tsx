// src/features/auth/MobileDrawerAccountMenu.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { LogIn, LogOut, User, Heart, CalendarDays, Shield, Activity, LifeBuoy } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { isEmailVerified } from '@/lib/auth/verification';
import { t, type Dictionary } from '@/i18n/getDictionary';

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

function initialsFromEmail(email?: string | null) {
  const s = (email ?? '').trim();
  if (!s) return 'U';
  const left = s.split('@')[0] || 'u';
  const parts = left
    .replace(/[^a-z0-9]/gi, ' ')
    .split(' ')
    .filter(Boolean);
  const a = (parts[0]?.[0] ?? left[0] ?? 'u').toUpperCase();
  const b = (parts[1]?.[0] ?? left[1] ?? '').toUpperCase();
  return `${a}${b}`.slice(0, 2);
}

function DrawerLink({
  href,
  onNavigate,
  className,
  children,
}: {
  href: string;
  onNavigate?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const handleClick = React.useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
    () => onNavigate?.(),
    [onNavigate],
  );

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={handleClick}
      className={clsx(
        'flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 shadow-soft transition hover:shadow-md',
        className,
      )}
    >
      {children}
      <span className="text-[color:var(--color-text)]/40">›</span>
    </Link>
  );
}

export function MobileDrawerAccountMenu({
  dict,
  onNavigate,
}: {
  dict: Dictionary;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const localePrefix = detectLocalePrefix(pathname);

  const [ready, setReady] = React.useState(false);
  const [email, setEmail] = React.useState<string | null>(null);
  const [verified, setVerified] = React.useState(false);

  const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
  const loginHref = `${localePrefix}/login${next}`;
  const registerHref = `${localePrefix}/register${next}`;

  const accountHref = `${localePrefix}/account`;
  const bookingsHref = `${localePrefix}/account/bookings`;
  const wishlistHref = `${localePrefix}/wishlist`;
  const supportHref = `${localePrefix}/account/support`;
  const securityHref = `${localePrefix}/account/security`;
  const activityHref = `${localePrefix}/account/activity`;

  React.useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      setReady(true);
      setEmail(null);
      setVerified(false);
      return;
    }

    const client = sb; // 👈 non-null para TS
    let alive = true;

    async function sync() {
      try {
        const { data } = await client.auth.getSession();
        const session = data.session;
        const u = session?.user ?? null;
        if (!alive) return;

        setEmail(u?.email ?? null);
        setVerified(u ? isEmailVerified(u) : false);
      } finally {
        if (alive) setReady(true);
      }
    }

    void sync();

    const { data: sub } = client.auth.onAuthStateChange(() => {
      void sync();
    });

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
      router.push(`${localePrefix || ''}/`);
    }
  }

  // loading (keep stable)
  if (!ready) {
    return (
      <div className="mt-2 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
        <div className="text-xs text-[color:var(--color-text)]/60">{t(dict, 'nav.loading', 'Cargando…')}</div>
      </div>
    );
  }

  // signed out
  if (!email) {
    return (
      <div className="mt-2 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
          {t(dict, 'nav.account', 'Cuenta')}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link
              href={loginHref}
              prefetch={false}
              onClick={() => {
                if (onNavigate) onNavigate(); // 👈 no pasar undefined
              }}
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {t(dict, 'nav.login', 'Iniciar sesión')}
              </span>
            </Link>
          </Button>

          <Button asChild size="sm" variant="ghost" className="rounded-xl">
            <Link
              href={registerHref}
              prefetch={false}
              onClick={() => {
                if (onNavigate) onNavigate();
              }}
            >
              {t(dict, 'nav.register', 'Crear cuenta')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const initials = initialsFromEmail(email);

  // helper para no “mandar undefined” con exactOptionalPropertyTypes
  const navProp = onNavigate ? { onNavigate } : {};

  return (
    <div className="mt-2 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-full bg-black/5 text-sm font-semibold dark:bg-[color:var(--color-surface)]/10">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">
            {t(dict, 'account.session_active', 'Sesión activa')}
          </div>
          <div className="truncate text-xs text-[color:var(--color-text)]/70">{email}</div>
          {!verified ? <div className="mt-1 text-xs text-amber-800 dark:text-amber-200">{t(dict, 'account.unverified', 'Sin verificar')}</div> : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <DrawerLink href={accountHref} {...navProp}>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <User className="h-4 w-4" aria-hidden="true" />
            {t(dict, 'account.manage', 'Mi cuenta')}
          </span>
        </DrawerLink>

        <div className="grid grid-cols-2 gap-2">
          <DrawerLink href={securityHref} className="px-3 py-2" {...navProp}>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
              <Shield className="h-4 w-4" aria-hidden="true" />
              {t(dict, 'account.security', 'Seguridad')}
            </span>
          </DrawerLink>

          <DrawerLink href={activityHref} className="px-3 py-2" {...navProp}>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
              <Activity className="h-4 w-4" aria-hidden="true" />
              {t(dict, 'account.activity', 'Actividad')}
            </span>
          </DrawerLink>
        </div>

        <DrawerLink href={bookingsHref} {...navProp}>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t(dict, 'account.bookings', 'Mis reservas')}
          </span>
        </DrawerLink>

        <DrawerLink href={wishlistHref} {...navProp}>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <Heart className="h-4 w-4" aria-hidden="true" />
            {t(dict, 'nav.wishlist', 'Wishlist')}
          </span>
        </DrawerLink>

        <DrawerLink href={supportHref} {...navProp}>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            {t(dict, 'account.support', 'Soporte')}
          </span>
        </DrawerLink>

        <Button type="button" variant="primary" size="sm" className="mt-1 rounded-xl" onClick={() => void signOut()}>
          <span className="inline-flex items-center gap-2">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t(dict, 'account.logout', 'Cerrar sesión')}
          </span>
        </Button>
      </div>
    </div>
  );
}
