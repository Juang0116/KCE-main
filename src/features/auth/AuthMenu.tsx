/* src/features/auth/AuthMenu.tsx */
'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { isEmailVerified } from '@/lib/auth/verification';
import { supabaseBrowser } from '@/lib/supabase/browser';
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

type Props = {
  dict: Dictionary;
  variant?: 'desktop' | 'mobile';
  /** Only used on mobile drawer: close the drawer after navigation */
  onNavigate?: () => void;
};

export default function AuthMenu({ dict, variant = 'desktop', onNavigate }: Props) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const localePrefix = detectLocalePrefix(pathname);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [verified, setVerified] = React.useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  const accountHref = `${localePrefix}/account`;
  const bookingsHref = `${localePrefix}/account/bookings`;
  const supportHref = `${localePrefix}/account/support`;
  const loginHref = `${localePrefix}/login?next=${encodeURIComponent(pathname)}`;
  const registerHref = `${localePrefix}/register?next=${encodeURIComponent(pathname)}`;
  const wishlistHref = `${localePrefix}/wishlist`;
  const verifyHref = `${localePrefix}/verify-email?next=${encodeURIComponent(pathname)}${
    email ? `&email=${encodeURIComponent(email)}` : ''
  }`;

  // ✅ FIX: correct handler type for <a onClick=...>
  const handleNav: React.MouseEventHandler<HTMLAnchorElement> = () => {
    onNavigate?.();
  };

  async function sync() {
    setLoading(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setEmail(null);
        setVerified(false);
        setAvatarUrl(null);
        return;
      }

      const { data } = await sb.auth.getSession();
      const session = data.session;
      if (!session) {
        setEmail(null);
        setVerified(false);
        setAvatarUrl(null);
        return;
      }

      const u = session.user;
      setEmail(u.email ?? null);
      setVerified(isEmailVerified(u));
      const meta = (u as any)?.user_metadata ?? {};
      setAvatarUrl((meta.avatar_url as string | undefined) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const sb = supabaseBrowser();
    if (!sb) return;
    await sb.auth.signOut();
    setOpen(false);
    onNavigate?.();
    router.refresh();
    router.push(`${localePrefix || ''}/`);
  }

  React.useEffect(() => {
    void sync();
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange(() => void sync());
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // close dropdown when route changes
  React.useEffect(() => setOpen(false), [pathname]);

  if (loading && variant === 'mobile') {
    return (
      <div className="mt-2 flex items-center gap-2">
        <Button disabled variant="primary" size="sm">
          {t(dict, 'nav.loading', 'Cargando…')}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={loginHref} onClick={handleNav}>
            {t(dict, 'nav.login', 'Iniciar sesión')}
          </Link>
        </Button>
      </div>
    );
  }

  // Signed out
  if (!email) {
    if (variant === 'mobile') {
      return (
        <div className="mt-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
            {t(dict, 'nav.account', 'Cuenta')}
          </div>
          <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
            {t(dict, 'account.access_title', 'Accede a tu cuenta KCE')}
          </div>
          <p className="mt-1 text-xs text-[color:var(--color-text)]/70">
            {t(dict, 'account.access_blurb', 'Inicia sesión para ver reservas, wishlist, soporte y tu actividad.')}
          </p>

          <div className="mt-3 grid gap-2">
            <Button asChild variant="primary" size="sm" className="w-full justify-center">
              <Link href={loginHref} onClick={handleNav}>
                {t(dict, 'nav.login', 'Iniciar sesión')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-center">
              <Link href={registerHref} onClick={handleNav}>
                {t(dict, 'nav.register', 'Crear cuenta')}
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={loginHref} onClick={handleNav}>
            {t(dict, 'nav.login', 'Iniciar sesión')}
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={registerHref} onClick={handleNav}>
            {t(dict, 'nav.register', 'Crear cuenta')}
          </Link>
        </Button>
      </div>
    );
  }

  const initials = initialsFromEmail(email);

  // ✅ Mobile drawer account section (the one you need)
  if (variant === 'mobile') {
    return (
      <div className="mt-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="dark:bg-[color:var(--color-surface)]/10 grid size-9 place-items-center rounded-full bg-black/5 text-sm font-semibold">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-[color:var(--color-text)]">
                {t(dict, 'account.session_active', 'Sesión activa')}
              </div>
              <div className="text-[color:var(--color-text)]/70 text-xs">{email}</div>
              {!verified ? (
                <div className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                  {t(dict, 'account.unverified', 'Sin verificar')}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={accountHref} onClick={handleNav}>
              {t(dict, 'account.manage', 'Administrar cuenta')}
            </Link>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`${localePrefix}/account/security`} onClick={handleNav}>
                {t(dict, 'account.security', 'Seguridad')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`${localePrefix}/account/activity`} onClick={handleNav}>
                {t(dict, 'account.activity', 'Actividad')}
              </Link>
            </Button>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link href={bookingsHref} onClick={handleNav}>
              {t(dict, 'account.bookings', 'Mis reservas')}
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link href={supportHref} onClick={handleNav}>
              {t(dict, 'account.support', 'Soporte')}
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link href={wishlistHref} onClick={handleNav}>
              {t(dict, 'nav.wishlist', 'Wishlist')}
            </Link>
          </Button>

          {!verified ? (
            <Button asChild variant="outline" size="sm">
              <Link href={verifyHref} onClick={handleNav}>
                {t(dict, 'account.verify', 'Verificar email')}
              </Link>
            </Button>
          ) : null}

          <Button type="button" variant="primary" size="sm" onClick={() => void logout()}>
            {t(dict, 'account.logout', 'Cerrar sesión')}
          </Button>
        </div>
      </div>
    );
  }

  // Desktop dropdown
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'inline-flex items-center gap-2 rounded-full px-2 py-1.5',
          'dark:hover:bg-[color:var(--color-surface)]/10 hover:bg-black/5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
        )}
        aria-label={t(dict, 'account.session_active', 'Sesión activa')}
        aria-expanded={open}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <div className="dark:bg-[color:var(--color-surface)]/10 grid size-8 place-items-center rounded-full bg-black/5 text-sm font-semibold">
            {initials}
          </div>
        )}
        <div className="hidden text-left lg:block">
          <div className="text-[color:var(--color-text)]/60 text-xs">
            {t(dict, 'account.session_active', 'Sesión activa')}
          </div>
          <div className="text-sm font-semibold leading-tight text-[color:var(--color-text)]">
            {email}
          </div>
        </div>
        {!verified ? (
          <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-200">
            {t(dict, 'account.unverified', 'Sin verificar')}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-pop"
        >
          <div className="px-4 py-3">
            <div className="text-[color:var(--color-text)]/60 text-xs">
              {t(dict, 'account.signed_in_as', 'Conectado como')}
            </div>
            <div className="mt-1 break-all text-sm font-semibold text-[color:var(--color-text)]">
              {email}
            </div>
          </div>
          <div className="h-px bg-[color:var(--color-border)]" />
          <div className="grid gap-1 p-2">
            <Link
              href={accountHref}
              className="rounded-xl px-3 py-2 text-sm no-underline hover:bg-black/5 hover:no-underline dark:hover:bg-[color:var(--color-surface-2)]"
              role="menuitem"
            >
              {t(dict, 'account.manage', 'Administrar cuenta')}
            </Link>
            <Link
              href={`${localePrefix}/account/security`}
              className="rounded-xl px-3 py-2 text-sm no-underline hover:bg-black/5 hover:no-underline dark:hover:bg-[color:var(--color-surface-2)]"
              role="menuitem"
            >
              {t(dict, 'account.security', 'Seguridad')}
            </Link>
            <Link
              href={`${localePrefix}/account/activity`}
              className="rounded-xl px-3 py-2 text-sm no-underline hover:bg-black/5 hover:no-underline dark:hover:bg-[color:var(--color-surface-2)]"
              role="menuitem"
            >
              {t(dict, 'account.activity', 'Actividad')}
            </Link>
            <Link
              href={bookingsHref}
              className="rounded-xl px-3 py-2 text-sm no-underline hover:bg-black/5 hover:no-underline dark:hover:bg-[color:var(--color-surface-2)]"
              role="menuitem"
            >
              {t(dict, 'account.bookings', 'Mis reservas')}
            </Link>

            <Link
              href={supportHref}
              className="rounded-xl px-3 py-2 text-sm no-underline hover:bg-black/5 hover:no-underline dark:hover:bg-[color:var(--color-surface-2)]"
              role="menuitem"
            >
              {t(dict, 'account.support', 'Soporte')}
            </Link>

            <Link
              href={wishlistHref}
              className="rounded-xl px-3 py-2 text-sm no-underline hover:bg-black/5 hover:no-underline dark:hover:bg-[color:var(--color-surface-2)]"
              role="menuitem"
            >
              {t(dict, 'nav.wishlist', 'Wishlist')}
            </Link>

            {!verified ? (
              <Link
                href={verifyHref}
                className="rounded-xl px-3 py-2 text-sm no-underline hover:bg-black/5 hover:no-underline dark:hover:bg-[color:var(--color-surface-2)]"
                role="menuitem"
              >
                {t(dict, 'account.verify', 'Verificar email')}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => void logout()}
              className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-[color:var(--color-surface-2)]"
              role="menuitem"
            >
              {t(dict, 'account.logout', 'Cerrar sesión')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
