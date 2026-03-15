'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Settings, Briefcase, LifeBuoy, CalendarCheck, Star, Users,
  TrendingUp, FileText, Activity, Lock, Rocket, Bot, ShieldCheck, ArrowRight
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
  { href: '/admin/ops', title: 'Operaciones', desc: 'Backups, Incidentes, Controles, Runbooks y Alarmas.', icon: Settings },
  { href: '/admin/sales', title: 'Ventas & CRM', desc: 'Deals, Autopilot AI, Pipeline y Conversión.', icon: Briefcase },
  { href: '/admin/bookings', title: 'Reservas', desc: 'Monitor de Bookings, Invoices y Pagos Confirmados.', icon: CalendarCheck },
  { href: '/admin/tickets', title: 'Soporte', desc: 'Bandeja de Tickets, SLAs y Handoff de Agentes.', icon: LifeBuoy },
  { href: '/admin/customers', title: 'Clientes', desc: 'Directorio 360, Historial, Tags y Segmentación.', icon: Users },
  { href: '/admin/metrics', title: 'Analytics', desc: 'Inteligencia de Negocio, Embudos y Atribución.', icon: TrendingUp },
  { href: '/admin/reviews', title: 'Reseñas', desc: 'Moderación, Prueba Social y Material Generado.', icon: Star },
  { href: '/admin/content', title: 'CMS & Blog', desc: 'Gestor de Contenidos, SEO, Landing Pages y Vlog.', icon: FileText },
  { href: '/admin/audit', title: 'Auditoría', desc: 'Logs de BBDD, Trazas de Eventos y Privacidad.', icon: Activity },
  { href: '/admin/rbac', title: 'Seguridad', desc: 'Control de Identidad, Break-glass y Permisos.', icon: Lock },
  { href: '/admin/qa', title: 'Release Gates', desc: 'E2E Testing, Verificación Stripe y Sanidad Pre-Launch.', icon: ShieldCheck },
  { href: '/admin/ai', title: 'AI Sandbox', desc: 'Calibración de Prompts, Labs y Concierge Config.', icon: Bot },
  { href: '/admin/launch-hq', title: 'Launch HQ', desc: 'Matriz Ejecutiva y Decisiones de Go-To-Market.', icon: Rocket },
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
          method: 'GET', cache: 'no-store', headers: { accept: 'application/json' },
        });
        const json = (await res.json().catch(() => ({}))) as AdminAccess;
        if (cancelled) return;
        setStatus(res.status);
        if (res.ok) { setAccess(json); setErr(''); } 
        else { setAccess(null); setErr((json as any)?.error || 'No se pudieron cargar permisos.'); }
      } catch {
        if (!cancelled) { setStatus(null); setErr('No se pudieron cargar permisos.'); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = React.useMemo(() => {
    if (!access) return [{ href: '/admin', title: 'Inicio', desc: 'Dashboard del panel.', icon: LayoutDashboard }];
    return cards.filter((c) => hasCapability(access, requiredCapForHref(c.href)));
  }, [access]);

  return (
    <div className="space-y-12 pb-20">
      
      {/* ELEGANT HEADER */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-dark p-8 md:p-12 text-white shadow-2xl transition-transform hover:scale-[1.01] duration-500">
        <div className="absolute inset-0 opacity-30 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/90 to-brand-blue/20"></div>
        
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
            <Activity className="h-3 w-3" /> KCE Operating System
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-5xl lg:text-6xl drop-shadow-md">
            Command Center
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-light leading-relaxed text-white/80 md:text-base">
            Bienvenido al núcleo operativo de Knowing Cultures Enterprise. Tienes acceso autorizado a las herramientas tácticas, comerciales y de inteligencia artificial que impulsan el crecimiento de la agencia.
          </p>

          {err && (
            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm backdrop-blur-md max-w-xl">
              <div className="font-semibold text-red-200 flex items-center gap-2"><Lock className="h-4 w-4"/> {err}</div>
              {status === 401 && (
                <div className="mt-3 text-white/80">
                  <p className="mb-4">Requiere validación de identidad para ingresar a los módulos seguros.</p>
                  <Link href={`${localeBase}/admin/login`} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-dark transition hover:bg-white/90 shadow-lg">
                    Iniciar Sesión Segura <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODULE GRID */}
      <div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <LayoutDashboard className="h-6 w-6 text-brand-blue" />
          <h2 className="font-heading text-2xl text-[var(--color-text)]">Módulos de Sistema Asignados</h2>
        </div>
        
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((c) => {
            const Icon = c.icon || LayoutDashboard;
            return (
              <Link
                key={c.href}
                href={`${localeBase}${c.href}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-blue/30 hover:shadow-xl"
              >
                <div>
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]/50 transition-all duration-300 group-hover:bg-brand-blue group-hover:border-brand-blue group-hover:text-white group-hover:shadow-md group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-xl text-[var(--color-text)] group-hover:text-brand-blue transition-colors">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-sm font-light leading-relaxed text-[var(--color-text)]/60">
                    {c.desc}
                  </p>
                </div>
                
                <div className="mt-6 flex items-center text-[10px] font-bold uppercase tracking-widest text-brand-blue opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  Acceder al Módulo <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="text-center pt-10 pb-4 border-t border-[var(--color-border)] mt-12">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
          KCE Core Architecture · Nivel de Acceso Verificado
        </div>
      </div>

    </div>
  );
}