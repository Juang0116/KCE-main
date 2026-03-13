'use client';

import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const localePrefix = (() => {
    const seg = pathname.split('/').filter(Boolean)[0] || '';
    if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
    return '';
  })();

  async function onLogout() {
    const sb = supabaseBrowser();
    if (!sb) return;
    await sb.auth.signOut();
    router.refresh();
    router.push(`${localePrefix}/`);
  }

  return (
    <Button
      variant="outline"
      onClick={onLogout}
    >
      Cerrar sesión
    </Button>
  );
}
