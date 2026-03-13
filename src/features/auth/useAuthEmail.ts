'use client';

import * as React from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

/**
 * Always returns a safe string email or null.
 * Keeps itself in sync with Supabase auth state.
 */
export function useAuthEmail(): string | null {
  const [email, setEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      setEmail(null);
      return;
    }

    let alive = true;

    // Initial session read
    sb.auth
      .getSession()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setEmail(null);
          return;
        }
        const e = data.session?.user?.email;
        setEmail(typeof e === 'string' ? e : null);
      })
      .catch(() => {
        if (!alive) return;
        setEmail(null);
      });

    // Subscribe to auth changes
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      const e = session?.user?.email;
      setEmail(typeof e === 'string' ? e : null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return email;
}
