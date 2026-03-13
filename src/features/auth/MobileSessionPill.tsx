// src/features/auth/MobileSessionPill.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogIn, LogOut, User } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

/**
 * Mobile-friendly session pill.
 * - Signed out: shows "Iniciar" and links to /login?next=
 * - Signed in: shows "Cuenta" and also a small "Salir" action.
 */
export function MobileSessionPill({ loginLabel = 'Iniciar sesión' }: { loginLabel?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = React.useState(false);
  const [signedIn, setSignedIn] = React.useState(false);

  const localePrefix = React.useMemo(() => {
    const seg = (pathname || '').split('/').filter(Boolean)[0] || '';
    return /^(es|en|de|fr)$/i.test(seg) ? `/${seg.toLowerCase()}` : '';
  }, [pathname]);

  React.useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      setReady(true);
      setSignedIn(false);
      return;
    }

    let alive = true;
    sb.auth
      .getUser()
      .then(({ data }) => {
        if (!alive) return;
        setSignedIn(Boolean(data?.user));
      })
      .finally(() => {
        if (!alive) return;
        setReady(true);
      });

    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (!alive) return;
      setSignedIn(Boolean(session?.user));
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';

  async function signOut() {
    try {
      const sb = supabaseBrowser();
      await sb?.auth.signOut();
    } finally {
      router.refresh();
      router.push(`${localePrefix || ''}/`);
    }
  }

  if (!ready) {
    return (
      <Button size="sm" variant="outline" className="h-9 rounded-full px-3">
        <span className="inline-flex items-center gap-2 text-xs">
          <User className="h-4 w-4" aria-hidden="true" />
          <span className="hidden min-[420px]:inline">{loginLabel}</span>
        </span>
      </Button>
    );
  }

  if (!signedIn) {
    return (
      <Button asChild size="sm" variant="outline" className="h-9 rounded-full px-3">
        <Link href={`${localePrefix}/login${next}`} prefetch={false} aria-label={loginLabel}>
          <span className="inline-flex items-center gap-2 text-xs">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span className="hidden min-[420px]:inline">{loginLabel}</span>
          </span>
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="outline" className="h-9 rounded-full px-3">
        <Link href={`${localePrefix}/account`} prefetch={false} aria-label="Cuenta">
          <span className="inline-flex items-center gap-2 text-xs">
            <User className="h-4 w-4" aria-hidden="true" />
            <span className="hidden min-[420px]:inline">Cuenta</span>
          </span>
        </Link>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="h-9 rounded-full px-3"
        onClick={() => void signOut()}
        aria-label="Cerrar sesión"
      >
        <span className="inline-flex items-center gap-2 text-xs">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden min-[420px]:inline">Salir</span>
        </span>
      </Button>
    </div>
  );
}
