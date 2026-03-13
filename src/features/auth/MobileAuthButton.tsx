// src/features/auth/MobileAuthButton.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

type Props = {
  /** Used to label buttons in the user's locale. */
  loginLabel: string;
};

export default function MobileAuthButton({ loginLabel }: Props) {
  const pathname = usePathname();
  const [ready, setReady] = React.useState(false);
  const [signedIn, setSignedIn] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase) {
      setReady(true);
      setSignedIn(false);
      return;
    }

    let alive = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!alive) return;
        const user = data?.user;
        setSignedIn(Boolean(user));
        const avatar = (user?.user_metadata as any)?.avatar_url;
        setAvatarUrl(typeof avatar === 'string' ? avatar : null);
      })
      .finally(() => {
        if (!alive) return;
        setReady(true);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      const user = session?.user ?? null;
      setSignedIn(Boolean(user));
      const avatar = (user?.user_metadata as any)?.avatar_url;
      setAvatarUrl(typeof avatar === 'string' ? avatar : null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // While booting, keep layout stable but avoid flashing wrong state.
  const href = signedIn ? '/account' : `/login${pathname ? `?next=${encodeURIComponent(pathname)}` : ''}`;

  return (
    <Button asChild variant="ghost" size="icon" aria-label={signedIn ? 'Cuenta' : loginLabel}>
      <Link href={href} prefetch={false} className="rounded-full">
        {ready && signedIn && avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Cuenta"
            className="h-8 w-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
      </Link>
    </Button>
  );
}
