'use client';

import * as React from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';

// Componentes y UI
import LocaleToggle from '@/components/LocaleToggle';
import ThemeToggle from '@/components/ThemeToggle';
import OpenChatButton from '@/features/ai/OpenChatButton';
import { MobileAuthActions } from '@/features/auth/MobileAuthActions';
import { MobileAccountRail } from '@/features/auth/MobileAccountRail';
import { HeaderAuthButton } from '@/features/auth/HeaderAuthButton';
import { t, type Dictionary } from '@/i18n/getDictionary';

// Iconos
import { 
  Heart, Menu, X, Home, MapPinned, Sparkles, BookOpen, 
  Video, MessageSquareText, Mail, HelpCircle, ShieldCheck 
} from 'lucide-react';

/* --- TIPOS --- */
type Props = {
  locale: string;
  dict: Dictionary;
  envLabel?: string;
  envHint?: string;
};

type NavItem = { href: string; label: string; show?: boolean };

/* --- HELPERS DE NAVEGACIÓN --- */
function buildNavPrimary(dict: Dictionary): NavItem[] {
  return [
    { href: '/tours', label: t(dict, 'nav.tours', 'Tours'), show: true },
    { href: '/destinations', label: t(dict, 'nav.destinations', 'Destinos'), show: true },
    { href: '/plan', label: t(dict, 'nav.quiz', 'Personalized plan'), show: true },
    { href: '/about', label: t(dict, 'nav.about', 'Nosotros'), show: true },
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
  if (href.startsWith('/tours') || href.startsWith('/destinations')) return MapPinned;
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

/* --- HELPERS DE RUTAS --- */
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

/* --- HOOKS --- */
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

/* --- PORTAL PARA MOBILE MENU --- */
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
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prev; };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <>
      {open && (
        <div className="fixed inset-0 z-[150] md:hidden">
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute inset-y-0 right-0 w-[min(90vw,400px)] border-l border-brand-dark/10 bg-[color:var(--color-surface)] shadow-2xl dark:bg-brand-dark">
            {children}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

/* --- COMPONENTE PRINCIPAL --- */
export default function Header({
  locale: localeFromServer,
  dict,
  envLabel,
  envHint,
}: Props) {
  const pathname = usePathname() || '/';
  const [open, setOpen] = React.useState(false);
  const scrolled = useScrolled(10);

  const split = splitLocale(pathname);
  const locale = (localeFromServer || split.locale || 'es').toLowerCase();
  const basePath = split.rest;

  const isActive = (href: string) => (href === '/' ? basePath === '/' : basePath.startsWith(href));

  React.useEffect(() => setOpen(false), [pathname]);

  const NAV_PRIMARY = React.useMemo(() => buildNavPrimary(dict), [dict]);
  const NAV_SECONDARY = React.useMemo(() => buildNavSecondary(dict), [dict]);

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-[100] h-[var(--header-h)] transition-all duration-300',
        scrolled
          ? 'border-b border-brand-dark/10 bg-white/80 backdrop-blur-md dark:bg-brand-dark/80'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        
        {/* Logo */}
        <Link href={withLocale(locale, '/')} className="flex items-center gap-3 no-underline">
          <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-2xl bg-[color:var(--color-surface)] shadow-sm ring-1 ring-brand-dark/5">
            <Image src="/brand/logo.png" alt="KCE" fill className="object-contain p-1.5" priority />
          </div>
          {envLabel && (
            <span className="hidden sm:inline-flex rounded-full bg-brand-yellow/20 px-2 py-0.5 text-[10px] font-bold text-[color:var(--color-text)] uppercase tracking-widest">
              {envLabel}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-brand-dark/5 bg-white/50 p-1.5 backdrop-blur-sm dark:bg-white/5">
          {NAV_PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={withLocale(locale, item.href)}
              className={clsx(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all no-underline",
                isActive(item.href)
                  ? "bg-brand-blue text-white"
                  : "text-[color:var(--color-text)]/60 hover:text-brand-blue"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            <Link href={withLocale(locale, '/wishlist')} className="text-[color:var(--color-text)]/50 hover:text-brand-blue transition-colors">
              <Heart className="h-5 w-5" />
            </Link>
            <LocaleToggle />
            <ThemeToggle />
            <HeaderAuthButton dict={dict} locale={locale} />
          </div>

          {/* Toggle Mobile */}
          <button
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/5 text-brand-blue md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenuPortal open={open} onClose={() => setOpen(false)}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <span className="font-heading font-bold text-brand-blue">Menú KCE</span>
            <button onClick={() => setOpen(false)} className="p-2"><X /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="rounded-3xl bg-brand-blue/5 p-4">
               <MobileAuthActions dict={dict} compact onNavigate={() => setOpen(false)} />
               <MobileAccountRail dict={dict} onNavigate={() => setOpen(false)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {NAV_PRIMARY.map((item) => {
                const Icon = iconForHref(item.href);
                return (
                  <Link key={item.href} href={withLocale(locale, item.href)} className="flex flex-col gap-2 rounded-2xl border p-4 no-underline text-[color:var(--color-text)]">
                    <Icon className="h-5 w-5 text-brand-blue" />
                    <span className="text-xs font-bold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="p-6 border-t space-y-3">
            <OpenChatButton className="w-full justify-center" />
            <Link href={withLocale(locale, '/contact')} className="flex w-full justify-center rounded-xl border py-3 text-sm font-bold no-underline text-[color:var(--color-text)]">
              Contacto
            </Link>
          </div>
        </div>
      </MobileMenuPortal>
    </header>
  );
}