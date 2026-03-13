'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useAuthEmail } from '@/features/auth/useAuthEmail';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { t, type Dictionary } from '@/i18n/getDictionary';

function initialsFromEmail(email: string) {
  const safe = typeof email === 'string' ? email : '';
  const left = safe.split('@')[0] || '';
  const bits = left.split(/[._-]+/g).filter(Boolean);
  const a = bits[0]?.[0] ?? left[0] ?? 'U';
  const b = bits[1]?.[0] ?? (left.length > 1 ? left[1] : '');
  return (a + b).toUpperCase();
}

function AvatarPill({ email }: { email: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
        {initialsFromEmail(email)}
      </span>
      <span className="hidden lg:inline-block max-w-48 truncate text-sm text-neutral-700 dark:text-neutral-200">
        {email}
      </span>
    </span>
  );
}

export function HeaderAuthButton({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale?: string;
}) {
  const router = useRouter();
  const email = useAuthEmail(); // string | null
  const base = locale ? `/${locale}` : '';

  if (!email) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="whitespace-nowrap rounded-full bg-[color:var(--color-surface)]/70 backdrop-blur"
        onClick={() => router.push(`${base}/login`)}
      >
        {t(dict, 'nav.login', 'Iniciar sesión')}
      </Button>
    );
  }

  async function signOut() {
    try {
      const sb = supabaseBrowser();
      await sb?.auth.signOut();
    } finally {
      router.refresh();
      router.push(`${base}/`);
    }
  }

  return (
    <DropdownMenu>
      {/* Tu Trigger espera children: React.ReactElement */}
      <DropdownMenuTrigger asChild>
        {/* ⚠️ NO usamos asChild en Button; solo lo usamos en DropdownTrigger */}
        <Button
          size="sm"
          variant="outline"
          className="whitespace-nowrap rounded-full bg-[color:var(--color-surface)]/70 backdrop-blur"
        >
          <AvatarPill email={email} />
          <span className="ml-2 hidden md:inline">{t(dict, 'nav.account', 'Cuenta')}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            router.push(`${base}/account`);
          }}
        >
          {t(dict, 'account.manage', 'Mi cuenta')}
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            router.push(`${base}/account/bookings`);
          }}
        >
          {t(dict, 'account.bookings', 'Mis reservas')}
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            router.push(`${base}/wishlist`);
          }}
        >
          {t(dict, 'nav.wishlist', 'Wishlist')}
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            router.push(`${base}/account/support`);
          }}
        >
          {t(dict, 'account.support', 'Soporte')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void signOut();
          }}
        >
          {t(dict, 'account.logout', 'Cerrar sesión')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
