'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  if (href.startsWith('/admin/metrics') || href.startsWith('/admin/analytics') || href.startsWith('/admin/revenue')) return 'analytics_view';
  if (href.startsWith('/admin/events')) return 'audit_view';
  if (href.startsWith('/admin/qa')) return 'ops_view';
  if (href.startsWith('/admin/launch-hq')) return 'admin_access';
  if (href.startsWith('/admin/ai')) return 'system_view';
  return 'admin_access';
}

const cards = [
  { href: '/admin/ops', title: 'Ops', desc: 'Backups, incident response, circuit breaker, runbook.' },
  { href: '/admin/sales', title: 'Ventas', desc: 'Leads → deals → pipeline y autopilot.' },
  { href: '/admin/tickets', title: 'Tickets', desc: 'Soporte: tickets, conversaciones y replies.' },
  { href: '/admin/bookings', title: 'Reservas', desc: 'Bookings, invoices y pagos.' },
  { href: '/admin/reviews', title: 'Reseñas', desc: 'Aprobar / rechazar y moderar reseñas.' },
  { href: '/admin/customers', title: 'Clientes', desc: 'CRM: clientes, actividad y segmentación.' },
  { href: '/admin/metrics', title: 'Métricas', desc: 'KPIs, funnels, performance y reportes.' },
  { href: '/admin/content', title: 'Contenido', desc: 'Blog, videos, pages y SEO.' },
  { href: '/admin/audit', title: 'Auditoría', desc: 'Logs y export seguro.' },
  { href: '/admin/rbac', title: 'RBAC', desc: 'Roles, permisos y política de acceso.' },
  { href: '/admin/qa', title: 'QA', desc: 'Gates, smoke checks y checklist de release.' },
  { href: '/admin/launch-hq', title: 'Launch HQ', desc: 'Cabina ejecutiva para decidir qué escalar, qué proteger y qué corregir hoy.' },
  { href: '/admin/ai', title: 'IA', desc: 'RAG, prompts, safety y analytics IA.' },
];

export function AdminHomeClient() {
  const pathname = usePathname();
  const [access, setAccess] = React.useState<AdminAccess | null>(null);
  const [err, setErr] = React.useState('');
  const [status, setStatus] = React.useState<number | null>(null);

  const localeBase = React.useMemo(() => {
    const seg = (pathname || '').split('/')[1] || '';
    // keep in sync with middleware locale list
    if (seg === 'es' || seg === 'en' || seg === 'de' || seg === 'fr') return `/${seg}`;
    return '';
  }, [pathname]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/rbac/me', {
          method: 'GET',
          cache: 'no-store',
          headers: { accept: 'application/json' },
        });
        const json = (await res.json().catch(() => ({}))) as AdminAccess;
        if (cancelled) return;
        setStatus(res.status);
        if (res.ok) {
          setAccess(json);
          setErr('');
        } else {
          setAccess(null);
          setErr((json as any)?.error || 'No se pudieron cargar permisos.');
        }
      } catch {
        if (!cancelled) {
          setStatus(null);
          setErr('No se pudieron cargar permisos.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = React.useMemo(() => {
    if (!access) return [{ href: '/admin', title: 'Inicio', desc: 'Dashboard del panel.' }];
    return cards.filter((c) => hasCapability(access, requiredCapForHref(c.href)));
  }, [access]);

  // NOTE: localeBase already computed above (avoid duplicate block-scoped variable errors)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel Admin</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">Acceso y módulos se ajustan automáticamente según tus permisos.</p>
        {err ? (
          <div className="mt-3 rounded-2xl border border-black/10 bg-white p-4 text-sm shadow-sm dark:border-white/10 dark:bg-black">
            <div className="font-semibold text-red-700 dark:text-red-300">{err}</div>

            {status === 401 ? (
              <div className="mt-2 text-black/70 dark:text-white/70">
                <p>
                  No estás autenticado como admin. Entra por{' '}
                  <span className="font-medium">/admin/login</span> o configura{' '}
                  <span className="font-medium">ADMIN_BASIC_USER / ADMIN_BASIC_PASS</span>.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`${localeBase}/admin/login`} className="rounded-full border border-black/10 bg-black px-4 py-2 text-xs font-semibold text-white hover:opacity-90 dark:border-white/10">
                    Ir a Admin Login
                  </Link>
                  <Link href={`${localeBase}/admin/rbac`} className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-black/5 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/10">
                    Ir a RBAC
                  </Link>
                </div>
              </div>
            ) : null}

            {status === 403 ? (
              <div className="mt-2 text-black/70 dark:text-white/70">
                <p>
                  Estás logueado, pero RBAC te está bloqueando (no tienes permisos aún). Solución rápida:
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  <li>
                    Ve a <span className="font-medium">/admin/rbac</span>.
                  </li>
                  <li>
                    Si es primera vez, usa <span className="font-medium">RBAC_BOOTSTRAP_SECRET</span> para crear el rol <span className="font-medium">owner</span>.
                  </li>
                  <li>
                    Luego instala el template <span className="font-medium">KCE Default Roles</span>.
                  </li>
                </ol>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`${localeBase}/admin/rbac`} className="rounded-full border border-black/10 bg-black px-4 py-2 text-xs font-semibold text-white hover:opacity-90 dark:border-white/10">
                    Abrir RBAC
                  </Link>
                  <Link href={`${localeBase}/admin`} className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-black/5 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/10">
                    Reintentar
                  </Link>
                </div>
                <p className="mt-3 text-xs text-black/60 dark:text-white/60">
                  Tip: mientras configuras, puedes dejar <span className="font-medium">RBAC_REQUIRED=0</span> (soft) y luego subirlo a <span className="font-medium">1</span>.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => (
          <Link
            key={c.href}
            href={`${localeBase}${c.href}`}
            className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-black"
          >
            <div className="text-base font-semibold">{c.title}</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
