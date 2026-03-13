'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { LogIn, LogOut, User } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { t, type Dictionary } from '@/i18n/getDictionary';

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

export function MobileAuthActions({
  dict,
  onNavigate,
  className,
  compact = false,
  drawer = false,
}: {
  dict: Dictionary;
  onNavigate?: () => void;
  className?: string;
  compact?: boolean;
  drawer?: boolean;
}) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const localePrefix = detectLocalePrefix(pathname);

  // 👇 FAIL-OPEN: por defecto asumimos signed-out (muestra login)
  const [email, setEmail] = React.useState<string | null>(null);

  const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
  const loginHref = `${localePrefix}/login${next}`;
  const accountHref = `${localePrefix}/account`;
  const homeHref = `${localePrefix || ''}/`;

  React.useEffect(() => {
    const sb = supabaseBrowser();

    // Si no hay cliente supabase, nos quedamos en signed-out (login visible)
    if (!sb) return;

    const client = sb;
    let alive = true;

    async function sync() {
      try {
        const { data } = await client.auth.getSession();
        if (!alive) return;
        setEmail(data.session?.user?.email ?? null);
      } catch {
        // ante error, mantenemos signed-out
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

  // Signed OUT (o aún no cargó sesión): SIEMPRE mostramos Login
  if (!email) {
    if (compact) {
      return (
        <Button asChild size="sm" variant="outline" className={clsx('h-9 rounded-full px-3 text-xs font-semibold shadow-soft', className)} aria-label={t(dict, 'nav.login', 'Iniciar sesión')}>
          <Link
            href={loginHref}
            prefetch={false}
            onClick={() => {
              if (onNavigate) onNavigate();
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              {t(dict, 'nav.login', 'Iniciar sesión')}
            </span>
          </Link>
        </Button>
      );
    }

    if (drawer) {
      return (
        <div className={clsx('grid gap-2', className)}>
          <Button asChild size="sm" variant="primary" className="w-full justify-center">
            <Link
              href={loginHref}
              prefetch={false}
              onClick={() => {
                if (onNavigate) onNavigate();
              }}
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {t(dict, 'nav.login', 'Iniciar sesión')}
              </span>
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline" className="w-full justify-center">
            <Link
              href={`${localePrefix}/register${next}`}
              prefetch={false}
              onClick={() => {
                if (onNavigate) onNavigate();
              }}
            >
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                {t(dict, 'nav.register', 'Crear cuenta')}
              </span>
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className={clsx('flex items-center gap-2', className)}>
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link
            href={loginHref}
            prefetch={false}
            onClick={() => {
              if (onNavigate) onNavigate();
            }}
          >
            <span className="inline-flex items-center gap-2">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t(dict, 'nav.login', 'Iniciar sesión')}
            </span>
          </Link>
        </Button>
      </div>
    );
  }

  // Signed IN
  if (compact) {
    return (
      <Button asChild size="sm" variant="outline" className={clsx('h-9 rounded-full px-3 text-xs font-semibold shadow-soft', className)} aria-label={t(dict, 'nav.account', 'Cuenta')}>
        <Link
          href={accountHref}
          prefetch={false}
          onClick={() => {
            if (onNavigate) onNavigate();
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            {t(dict, 'nav.account', 'Cuenta')}
          </span>
        </Link>
      </Button>
    );
  }

  if (drawer) {
    return (
      <div className={clsx('grid gap-2', className)}>
        <Button asChild size="sm" variant="primary" className="w-full justify-center">
          <Link
            href={accountHref}
            prefetch={false}
            onClick={() => {
              if (onNavigate) onNavigate();
            }}
          >
            <span className="inline-flex items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              {t(dict, 'nav.account', 'Cuenta')}
            </span>
          </Link>
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="w-full justify-center"
          type="button"
          onClick={() => void signOut()}
        >
          <span className="inline-flex items-center gap-2">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t(dict, 'account.logout', 'Salir')}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <Button asChild size="sm" variant="outline" className="rounded-full">
        <Link
          href={accountHref}
          prefetch={false}
          onClick={() => {
            if (onNavigate) onNavigate();
          }}
        >
          <span className="inline-flex items-center gap-2">
            <User className="h-4 w-4" aria-hidden="true" />
            {t(dict, 'nav.account', 'Cuenta')}
          </span>
        </Link>
      </Button>

      <Button
        size="sm"
        variant="primary"
        className="rounded-full"
        type="button"
        onClick={() => void signOut()}
      >
        <span className="inline-flex items-center gap-2">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t(dict, 'account.logout', 'Salir')}
        </span>
      </Button>
    </div>
  );
}
