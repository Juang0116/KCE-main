// src/components/Header.tsx
'use client';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { createPortal } from 'react-dom';

import LocaleToggle from '@/components/LocaleToggle';
import ThemeToggle from '@/components/ThemeToggle';
import OpenChatButton from '@/features/ai/OpenChatButton';
import { MobileAuthActions } from '@/features/auth/MobileAuthActions';
import { MobileAccountRail } from '@/features/auth/MobileAccountRail';
import { HeaderAuthButton } from '@/features/auth/HeaderAuthButton';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { t, type Dictionary } from '@/i18n/getDictionary';
import {
  BookOpen,
  HelpCircle,
  Heart,
  Home,
  Mail,
  MapPinned,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';

type Props = {
  locale: string;
  dict: Dictionary;
  /** Safe operator label shown in UI, e.g. TEST/LIVE */
  envLabel?: string | undefined;
  /** Optional tooltip hint */
  envHint?: string | undefined;
};
type NavItem = { href: string; label: string; show?: boolean };

function buildNavPrimary(dict: Dictionary): NavItem[] {
  return [
    { href: '/tours', label: t(dict, 'nav.tours', 'Tours'), show: true },
    { href: '/destinations', label: t(dict, 'nav.destinations', 'Destinations'), show: true },
    { href: '/plan', label: 'Plan personalizado', show: true },
    { href: '/about', label: t(dict, 'nav.about', 'About'), show: true },
    { href: '/contact', label: t(dict, 'nav.contact', 'Contacto'), show: true },
  ];
}

function buildNavSecondary(dict: Dictionary): NavItem[] {
  return [
    { href: '/faq', label: t(dict, 'nav.faq', 'FAQ'), show: true },
    { href: '/wishlist', label: t(dict, 'nav.wishlist', 'Wishlist'), show: true },
  ];
}

function iconForHref(href: string) {
  if (href === '/') return Home;
  if (href.startsWith('/tours')) return MapPinned;
  if (href.startsWith('/destinations')) return MapPinned;
  if (href.startsWith('/plan')) return Sparkles;
  if (href.startsWith('/blog')) return BookOpen;
  if (href.startsWith('/vlog')) return Video;
  if (href.startsWith('/about')) return MessageSquareText;
  if (href.startsWith('/contact')) return Mail;
  if (href.startsWith('/faq')) return HelpCircle;
  if (href.startsWith('/trust')) return ShieldCheck;
  if (href.startsWith('/wishlist')) return Heart;
  return Sparkles;
}

function splitLocale(pathname: string): { locale: string; rest: string } {
  const m = pathname.match(/^\/(es|en|fr|de)(?=\/|$)/);
  const locale = (m?.[1] || 'es').toLowerCase();
  const rest = pathname.replace(/^\/(es|en|fr|de)(?=\/|$)/, '') || '/';
  return { locale, rest };
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function useScrolled(threshold = 4) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function MobileMenuPortal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const { style } = document.documentElement;
    const prev = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' ? onClose() : undefined);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      {open && (
        <div className="fixed inset-0 z-[var(--z-modal)] md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="bg-[var(--overlay-strong)]/40 absolute inset-0"
            onClick={onClose}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="absolute inset-y-0 right-0 w-[min(92vw,420px)] border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-pop"
          >
            {children}
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}

export default function Header({
  locale: localeFromServer,
  dict,
  envLabel,
  envHint,
}: Props): React.JSX.Element {
  const pathname = usePathname() || '/';
  const [open, setOpen] = React.useState(false);
  const scrolled = useScrolled(4);

  const split = splitLocale(pathname);
  const locale = (localeFromServer || split.locale || 'es').toLowerCase();
  const basePath = split.rest;

  const isActive = (href: string) => (href === '/' ? basePath === '/' : basePath.startsWith(href));

  React.useEffect(() => setOpen(false), [pathname]);

  const NAV_PRIMARY = React.useMemo(() => buildNavPrimary(dict), [dict]);
  const NAV_SECONDARY = React.useMemo(() => buildNavSecondary(dict), [dict]);

  const mobileWhatsAppHref = React.useMemo(() => {
    const number = String(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').trim();
    if (!number) return '';
    const baseMsg =
      String(process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || '').trim() ||
      'Hola KCE, quiero información sobre un tour.';
    return buildWhatsAppHref({ number, message: baseMsg, url: pathname || '' });
  }, [pathname]);


  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-[var(--z-header)]',
        'h-[var(--header-h)]',
        scrolled
          ? 'bg-[color:var(--color-bg)]/76 border-b border-[var(--color-border)]/80 backdrop-blur-md shadow-soft'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        {/* Brand (solo logo, más grande) */}
        <Link
          href={withLocale(locale, '/')}
          className="flex items-center !no-underline hover:!no-underline"
          aria-label="KCE — Inicio"
        >
          <span
            className={clsx(
              'relative overflow-hidden',
              'h-11 w-11 md:h-12 md:w-12',
              'rounded-2xl',
              'bg-transparent',
            )}
          >
            <Image
              src="/brand/logo.png"
              alt="KCE"
              fill
              sizes="(min-width: 768px) 48px, 44px"
              className="object-contain"
              priority
            />
          </span>

          {/* Env pill (TEST/LIVE) — safe to show */}
          {(() => {
            const label = String(envLabel || '').trim().toUpperCase();
            if (!label) return null;
            const isLive = label === 'LIVE';
            return (
              <span
                title={String(envHint || label)}
                className={clsx(
                  'ml-2 hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide',
                  isLive
                    ? 'border-emerald-300/60 bg-emerald-50 text-emerald-700'
                    : 'border-amber-300/60 bg-amber-50 text-amber-700',
                )}
              >
                {label}
              </span>
            );
          })()}
        </Link>

        {/* Desktop nav (modern pill bar) */}
        <nav className="hidden md:flex" aria-label={t(dict, 'nav.aria_primary', 'Primary navigation')}>
          <div
            className={clsx(
              'flex items-center gap-1 rounded-full border border-[var(--color-border)]',
              'bg-[color:var(--color-surface)]/86 px-1 py-1 shadow-soft',
            )}
          >
            {NAV_PRIMARY.filter((x) => x.show !== false).map((l) => (
              <Link
                key={l.href}
                href={withLocale(locale, l.href)}
                className={clsx(
                  '!no-underline hover:!no-underline rounded-full px-3 py-1.5 text-sm font-heading tracking-tight transition',
                  isActive(l.href)
                    ? 'bg-[color:var(--color-surface-2)] font-semibold text-[color:var(--color-text)]'
                    : 'text-[color:var(--color-text)]/70 hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]',
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop quick access (customers) */}
          <Link
            href={withLocale(locale, '/wishlist')}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-border bg-background/88 px-3 py-1 text-sm shadow-sm hover:bg-background !no-underline hover:!no-underline text-[color:var(--color-text)]/80"
            aria-label={t(dict, 'nav.wishlist', 'Wishlist')}
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">{t(dict, 'nav.wishlist', 'Wishlist')}</span>
          </Link>

          <LocaleToggle className="hidden md:inline-flex" />
          <ThemeToggle className="hidden md:inline-flex" />

          <div className="hidden md:flex shrink-0">
            <HeaderAuthButton dict={dict} locale={locale} />
          </div>

          {/* Mobile quick account access */}
          <div className="md:hidden shrink-0">
            <MobileAuthActions dict={dict} compact />
          </div>

          <button
            type="button"
            className={clsx(
              'inline-flex size-10 items-center justify-center rounded-full md:hidden',
              'dark:hover:bg-[color:var(--color-surface)]/10 hover:bg-black/5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
            )}
            aria-label={
              open ? t(dict, 'common.close_menu', 'Close menu') : t(dict, 'common.open_menu', 'Open menu')
            }
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{t(dict, 'common.menu', 'Menu')}</span>
            <div className="grid gap-1">
              <span
                className={clsx(
                  'block h-0.5 w-5 rounded bg-[color:var(--color-text)] transition',
                  open && 'translate-y-1.5 rotate-45',
                )}
              />
              <span
                className={clsx(
                  'block h-0.5 w-5 rounded bg-[color:var(--color-text)] transition',
                  open && 'opacity-0',
                )}
              />
              <span
                className={clsx(
                  'block h-0.5 w-5 rounded bg-[color:var(--color-text)] transition',
                  open && '-translate-y-1.5 -rotate-45',
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <MobileMenuPortal open={open} onClose={() => setOpen(false)}>
        <div className="flex h-full flex-col">
          {/* Drawer header */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-2xl">
                <Image src="/brand/logo.png" alt="KCE" fill sizes="36px" className="object-contain" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-[color:var(--color-text)]">{t(dict, 'nav.menu', 'Menu')}</div>
                <div className="text-xs text-[color:var(--color-text)]/60">Knowing Cultures Enterprise</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="mr-1">
                <MobileAuthActions dict={dict} compact onNavigate={() => setOpen(false)} />
              </div>
              <LocaleToggle />
              <ThemeToggle />
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] !no-underline hover:!no-underline"
                aria-label={t(dict, 'common.close_menu', 'Close menu')}
                onClick={() => setOpen(false)}
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
            <div className="sticky top-0 z-10 -mx-1 mb-3 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)]/95 p-3 shadow-soft backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/60">
                {t(dict, 'nav.account', 'Cuenta')}
              </div>
              <div className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">
                {t(dict, 'account.quick_access', 'Acceso rápido')}
              </div>
              <p className="mt-1 text-xs text-[color:var(--color-text)]/65">
                {t(dict, 'account.quick_access_blurb', 'Login, cuenta y registro siempre visibles también en mobile vertical.')}
              </p>
              <MobileAccountRail dict={dict} onNavigate={() => setOpen(false)} />
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
                {t(dict, 'nav.explore', 'Explorar')}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {NAV_PRIMARY.filter((x) => x.show !== false).map((l) => {
                  const Icon = iconForHref(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={withLocale(locale, l.href)}
                      className={clsx(
                        '!no-underline hover:!no-underline rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-3 shadow-soft transition hover:shadow-md',
                        isActive(l.href) && 'ring-2 ring-brand-blue/20',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="grid size-9 place-items-center rounded-xl bg-white/60 dark:bg-black/20">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="text-sm font-semibold tracking-tight text-[color:var(--color-text)]">{l.label}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
                {t(dict, 'nav.more', 'Más')}
              </div>
              <div className="mt-2 grid gap-2">
                {NAV_SECONDARY.filter((x) => x.show !== false).map((l) => {
                  const Icon = iconForHref(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={withLocale(locale, l.href)}
                      className={clsx(
                        '!no-underline hover:!no-underline flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 shadow-soft transition hover:shadow-md',
                        isActive(l.href) && 'ring-2 ring-brand-blue/20',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-black/5 dark:bg-white/10">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="text-sm font-semibold tracking-tight text-[color:var(--color-text)]">{l.label}</div>
                      </div>
                      <span className="text-[color:var(--color-text)]/40">›</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
                {t(dict, 'nav.support_24_7', 'Soporte 24/7')}
              </div>
              <p className="mt-2 text-xs text-[color:var(--color-text)]/60">
                {t(dict, 'nav.support_blurb', 'Habla con nuestra IA para recomendaciones, dudas y soporte de tu reserva.')}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <OpenChatButton />

                {mobileWhatsAppHref ? (
                  <a
                    href={mobileWhatsAppHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 shadow-soft transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <Link
                    href={withLocale(locale, '/contact')}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm font-semibold text-[color:var(--color-text)] shadow-soft transition hover:bg-[color:var(--color-surface-2)] !no-underline hover:!no-underline"
                  >
                    {t(dict, 'nav.contact', 'Contacto')}
                  </Link>
                )}
              </div>

              <div className="mt-2 grid gap-2">
                <Link
                  href={withLocale(locale, '/contact')}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm font-semibold text-[color:var(--color-text)] shadow-soft transition hover:bg-[color:var(--color-surface-2)] !no-underline hover:!no-underline"
                >
                  {t(dict, 'nav.contact', 'Contacto')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MobileMenuPortal>
    </header>
  );
}
