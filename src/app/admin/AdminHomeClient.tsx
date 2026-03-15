'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Settings, Briefcase, LifeBuoy, CalendarCheck, Star, Users,
  TrendingUp, FileText, Activity, Lock, Rocket, Bot, ShieldCheck
} from 'lucide-react';

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
  { href: '/admin/ops', title: 'Operaciones', desc: 'Backups, incident response, circuit breaker y runbook.', icon: Settings },
  { href: '/admin/sales', title: 'Ventas & CRM', desc: 'Leads, deals, pipeline interactivo y Autopilot.', icon: Briefcase },
  { href: '/admin/bookings', title: 'Reservas', desc: 'Gestión de Bookings, invoices y pagos.', icon: CalendarCheck },
  { href: '/admin/tickets', title: 'Soporte', desc: 'Resolución de tickets, conversaciones y mensajería.', icon: LifeBuoy },
  { href: '/admin/customers', title: 'Directorio', desc: 'Base de datos de clientes, actividad y segmentación.', icon: Users },
  { href: '/admin/metrics', title: 'Métricas', desc: 'KPIs, embudos de conversión, performance y reportes.', icon: TrendingUp },
  { href: '/admin/reviews', title: 'Reseñas', desc: 'Aprobar, rechazar y moderar feedback de clientes.', icon: Star },
  { href: '/admin/content', title: 'CMS & Contenido', desc: 'Gestor de Blog, videos, páginas y optimización SEO.', icon: FileText },
  { href: '/admin/audit', title: 'Auditoría', desc: 'Logs del sistema, eventos y exportación de datos.', icon: Activity },
  { href: '/admin/rbac', title: 'Seguridad (RBAC)', desc: 'Control de Roles, permisos y políticas de acceso.', icon: Lock },
  { href: '/admin/qa', title: 'Calidad (QA)', desc: 'Smoke checks y validación del estado del sistema.', icon: ShieldCheck },
  { href: '/admin/ai', title: 'Inteligencia Artificial', desc: 'Configuración de Agentes, prompts y safety.', icon: Bot },
  { href: '/admin/launch-hq', title: 'Launch HQ', desc: 'Cabina ejecutiva para decisiones estratégicas.', icon: Rocket },
];

export function AdminHomeClient() {
  const pathname = usePathname();
  const [access, setAccess] = React.useState<AdminAccess | null>(null);
  const [err, setErr] = React.useState('');
  const [status, setStatus] = React.useState<number | null>(null);

  const localeBase = React.useMemo(() => {
    const seg = (pathname || '').split('/')[1] || '';
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
    if (!access) return [{ href: '/admin', title: 'Inicio', desc: 'Dashboard del panel.', icon: LayoutDashboard }];
    return cards.filter((c) => hasCapability(access, requiredCapForHref(c.href)));
  }, [access]);

  return (
    <div className="space-y-12 pb-20">
      
      {/* 1. ELEGANT HEADER */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-dark p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
            KCE Operating System
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-5xl">
            Command Center
          </h1>
          <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-white/70 md:text-base">
            Bienvenido al núcleo de Knowing Cultures Enterprise. Aquí tienes acceso inmediato a todas las herramientas operativas, comerciales y de inteligencia artificial de la agencia.
          </p>

          {err && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm backdrop-blur-md">
              <div className="font-semibold text-red-400">{err}</div>
              {status === 401 && (
                <div className="mt-3 text-white/80">
                  <p>Inicia sesión en <span className="font-medium text-white">/admin/login</span> para acceder a los módulos.</p>
                  <Link href={`${localeBase}/admin/login`} className="mt-4 inline-block rounded-full bg-white px-6 py-2.5 text-xs font-bold text-brand-dark transition hover:bg-white/90">
                    Ir al Login
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. MODULE GRID */}
      <div>
        <h2 className="mb-6 font-heading text-2xl text-brand-blue">Tus Módulos Activos</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((c) => {
            const Icon = c.icon || LayoutDashboard;
            return (
              <Link
                key={c.href}
                href={`${localeBase}${c.href}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-pop"
              >
                <div>
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)]/50 transition-colors duration-300 group-hover:bg-brand-blue/10 group-hover:text-brand-blue">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-xl text-[var(--color-text)] group-hover:text-brand-blue transition-colors">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-[var(--color-text)]/60">
                    {c.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}