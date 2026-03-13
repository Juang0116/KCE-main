'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function WishlistButton({ tourId, tourSlug }: { tourId: string; tourSlug: string }) {
  const [signedIn, setSignedIn] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    const sb = supabaseBrowser();

    // Si el cliente Supabase no está configurado (env faltante), no hacemos nada.
    if (!sb) {
      setSignedIn(false);
      return () => {
        alive = false;
      };
    }

    sb.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setSignedIn(Boolean(data.session));
      })
      .catch(() => {
        if (!alive) return;
        setSignedIn(false);
      });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setSignedIn(Boolean(session));
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      const sb = supabaseBrowser();

      // Si no hay Supabase configurado en el cliente, manda a login (o podrías ocultar wishlist).
      if (!sb) {
        window.location.href = '/login';
        return;
      }

      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;

      // Si no hay sesión, redirige a login (o abre modal)
      if (!token) {
        window.location.href = '/login';
        return;
      }

      await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tourId, tourSlug }),
      });
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return (
      <Button
        type="button"
        onClick={() => (window.location.href = '/login')}
        variant="outline"
        size="sm"
      >
        Guardar
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={toggle}
      disabled={busy}
      variant="outline"
      size="sm"
      isLoading={busy}
    >
      Wishlist
    </Button>
  );
}
