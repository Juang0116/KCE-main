'use client';

import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

/**
 * Cierra sesión en todos los dispositivos.
 * Nota: Supabase soporta `signOut({ scope: 'global' })` en v2; usamos `any` defensivo
 * para no romper builds si la firma cambia.
 */
export function GlobalLogoutButton() {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const localePrefix = (() => {
    const seg = pathname.split('/').filter(Boolean)[0] || '';
    if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
    return '';
  })();

  async function onLogoutGlobal() {
    const sb = supabaseBrowser();
    if (!sb) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await (sb.auth as any).signOut?.({ scope: 'global' });
    router.refresh();
    router.push(`${localePrefix}/`);
  }

  return (
    <Button
      variant="outline"
      onClick={onLogoutGlobal}
    >
      Cerrar sesión (todos)
    </Button>
  );
}
