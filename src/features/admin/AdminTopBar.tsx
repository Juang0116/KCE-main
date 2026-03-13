// src/features/admin/AdminTopBar.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';

type AdminAccess = {
  ok?: boolean;
  permissions?: string[];
  hasAll?: boolean;
};

function hasCapability(access: AdminAccess | null, cap: string) {
  if (!cap) return true;
  if (!access) return false;
  if (access.hasAll) return true;
  const perms = Array.isArray(access.permissions) ? access.permissions : [];
  return perms.includes(cap);
}

function requiredCapForHref(href: string): string {
  if (href === '/admin') return 'admin_access';
  if (href.startsWith('/admin/ops') || href.startsWith('/admin/runbook')) return 'ops_view';
  if (href.startsWith('/admin/rbac')) return 'rbac_admin';
  if (href.startsWith('/admin/audit')) return 'audit_view';
  if (href.startsWith('/admin/sales') || href.startsWith('/admin/leads') || href.startsWith('/admin/tickets') || href.startsWith('/admin/customers') || href.startsWith('/admin/deals') || href.startsWith('/admin/outbound') || href.startsWith('/admin/templates') || href.startsWith('/admin/segments') || href.startsWith('/admin/tasks') || href.startsWith('/admin/conversations')) return 'crm_view';
  if (href.startsWith('/admin/bookings')) return 'bookings_view';
  if (href.startsWith('/admin/reviews')) return 'reviews_view';
  if (href.startsWith('/admin/content')) return 'content_view';
  if (href.startsWith('/admin/metrics') || href.startsWith('/admin/marketing') || href.startsWith('/admin/analytics') || href.startsWith('/admin/revenue')) return 'analytics_view';
  if (href.startsWith('/admin/events')) return 'audit_view';
  if (href.startsWith('/admin/qa')) return 'ops_view';
  if (href.startsWith('/admin/ai')) return 'system_view';
  return 'admin_access';
}

function dedupeByHref<T extends { href: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const it of items) {
    // First wins to avoid UI jitter if arrays are composed from multiple sources.
    if (!map.has(it.href)) map.set(it.href, it);
  }
  return Array.from(map.values());
}

export function AdminTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [access, setAccess] = React.useState<AdminAccess | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/rbac/me', { method: 'GET', cache: 'no-store', headers: { accept: 'application/json' } });
        const json = (await res.json().catch(() => ({}))) as AdminAccess;
        if (!cancelled && res.ok) setAccess(json);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    setMsg('');
    setLoading(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.replace('/admin/login');
      router.refresh();
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo cerrar sesión.'));
    } finally {
      setLoading(false);
    }
  }

  // Nota: mantenemos una barra superior corta para desktop, pero el menú móvil muestra el set completo.
  const items = [
    { href: '/admin', label: 'Inicio' },
    { href: '/admin/ops', label: 'Ops' },
    { href: '/admin/ops/incidents', label: 'Incidentes' },
    { href: '/admin/rbac', label: 'RBAC' },
    { href: '/admin/audit', label: 'Auditoría' },
    { href: '/admin/sales', label: 'Ventas' },
    { href: '/admin/bookings', label: 'Reservas' },
    { href: '/admin/tickets', label: 'Tickets' },
    { href: '/admin/leads', label: 'Leads' },
    { href: '/admin/metrics', label: 'Métricas' },
    { href: '/admin/marketing', label: 'Marketing' },
    { href: '/admin/revenue', label: 'Revenue Ops' },
    { href: '/admin/content', label: 'Contenido' },
    { href: '/admin/templates', label: 'Plantillas' },
    { href: '/admin/outbound', label: 'Outbound' },
    { href: '/admin/events', label: 'Eventos' },
    { href: '/admin/qa', label: 'QA' },
    { href: '/admin/ai', label: 'IA' },
  ];

  const allItems = [
    ...items,
    { href: '/admin/customers', label: 'Clientes' },
    { href: '/admin/deals', label: 'Deals' },
    { href: '/admin/reviews', label: 'Reseñas' },
    { href: '/admin/segments', label: 'Segmentos' },
    { href: '/admin/tasks', label: 'Tareas' },
    { href: '/admin/conversations', label: 'Conversaciones' },
    { href: '/admin/runbook', label: 'Runbook' },
  ];

  const visibleItems = React.useMemo(() => {
    if (!access) return items.filter((it) => it.href === '/admin');
    return dedupeByHref(items.filter((it) => hasCapability(access, requiredCapForHref(it.href))));
  }, [access]);

  const visibleAllItems = React.useMemo(() => {
    if (!access) return allItems.filter((it) => it.href === '/admin');
    return dedupeByHref(allItems.filter((it) => hasCapability(access, requiredCapForHref(it.href))));
  }, [access]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="sticky top-0 z-40 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <button
          type="button"
          className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--color-text)]/80 hover:bg-black/5 md:hidden"
          aria-label="Abrir menú de admin"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="text-xl leading-none">☰</span>
        </button>

        <Link href="/admin" className="font-semibold tracking-tight text-[color:var(--color-text)]">
          KCE Admin
        </Link>

        <nav className="ml-2 hidden flex-1 items-center gap-2 overflow-x-auto md:flex">
          {visibleItems.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + '/');
            return (
              <Link
                // Evita warnings si por cualquier razón hay href duplicados.
                key={`${it.href}:${it.label}`}
                href={it.href}
                className={[
                  'rounded-xl px-3 py-2 text-sm',
                  active
                    ? 'bg-black/10 text-[color:var(--color-text)]'
                    : 'text-[color:var(--color-text)]/70 hover:bg-black/5 hover:text-[color:var(--color-text)]',
                ].join(' ')}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="secondary" isLoading={loading} onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Menú móvil */}
      {menuOpen ? (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div className="fixed left-0 top-0 z-50 h-full w-[86vw] max-w-sm overflow-auto border-r border-black/10 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-black">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">Navegación</div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[color:var(--color-text)]/80 hover:bg-black/5"
                aria-label="Cerrar menú"
                onClick={closeMenu}
              >
                ✕
              </button>
            </div>

            <nav className="mt-3 grid gap-1">
              {visibleAllItems.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + '/');
                return (
                  <Link
                    key={`${it.href}:${it.label}`}
                    href={it.href}
                    onClick={closeMenu}
                    className={[
                      'rounded-xl px-3 py-2 text-sm',
                      active
                        ? 'bg-black/10 text-[color:var(--color-text)]'
                        : 'text-[color:var(--color-text)]/75 hover:bg-black/5 hover:text-[color:var(--color-text)]',
                    ].join(' ')}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
              <Button
                type="button"
                variant="secondary"
                isLoading={loading}
                onClick={async () => {
                  closeMenu();
                  await logout();
                }}
                className="w-full"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {msg ? (
        <div className="mx-auto max-w-6xl px-6 pb-3 text-xs text-red-600 dark:text-red-300">{msg}</div>
      ) : null}
    </div>
  );
}
