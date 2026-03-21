'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  CheckCircle2, LayoutDashboard, Users, Briefcase, MessageSquare, CheckSquare, 
  Send, CalendarCheck, LifeBuoy, Settings, ShieldAlert, BookOpen, 
  TrendingUp, Megaphone, PieChart, Star, FileText, Database, 
  Bot, Lock, Activity, LogOut, Menu, X
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
  if (href.startsWith('/admin/audit') || href.startsWith('/admin/events')) return 'audit_view';
  if (href.startsWith('/admin/sales') || href.startsWith('/admin/leads') || href.startsWith('/admin/tickets') || href.startsWith('/admin/customers') || href.startsWith('/admin/deals') || href.startsWith('/admin/outbound') || href.startsWith('/admin/agents') || href.startsWith('/admin/tasks') || href.startsWith('/admin/conversations')) return 'crm_view';
  if (href.startsWith('/admin/bookings')) return 'bookings_view';
  if (href.startsWith('/admin/reviews')) return 'reviews_view';
  if (href.startsWith('/admin/content') || href.startsWith('/admin/templates')) return 'content_view';
  if (href.startsWith('/admin/metrics') || href.startsWith('/admin/marketing') || href.startsWith('/admin/revenue') || href.startsWith('/admin/segments')) return 'analytics_view';
  if (href.startsWith('/admin/qa')) return 'ops_view';
  if (href.startsWith('/admin/ai') || href.startsWith('/admin/setup')) return 'system_view';
  return 'admin_access';
}

export function AdminTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(false);
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
    return () => { cancelled = true; };
  }, []);

  async function logout() {
    setLoading(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.replace('/admin/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  // 📂 ESTRUCTURA LÓGICA Y ORDENADA DEL MENÚ
  const groups = [
    {
      label: 'General',
      items: [
        { href: '/admin', label: 'Command Center', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Comercial (CRM)',
      items: [
        { href: '/admin/deals/board', label: 'Pipeline de Ventas', icon: Briefcase },
        { href: '/admin/leads', label: 'Leads', icon: Users },
        { href: '/admin/conversations', label: 'Conversaciones', icon: MessageSquare },
        { href: '/admin/tasks', label: 'Mis Tareas', icon: CheckSquare },
        { href: '/admin/outbound', label: 'Bandeja Salida IA', icon: Send },
        { href: '/admin/agents', label: 'Agentes IA', icon: Bot },
        { href: '/admin/customers', label: 'Directorio Clientes', icon: Database },
      ],
    },
    {
      label: 'Operaciones',
      items: [
        { href: '/admin/bookings', label: 'Reservas', icon: CalendarCheck },
        { href: '/admin/tickets', label: 'Tickets de Soporte', icon: LifeBuoy },
        { href: '/admin/ops', label: 'Panel Ops', icon: Settings },
        { href: '/admin/ops/incidents', label: 'Incidentes', icon: ShieldAlert },
        { href: '/admin/runbook', label: 'Runbooks', icon: BookOpen },
      ],
    },
    {
      label: 'Growth & Analytics',
      items: [
        { href: '/admin/metrics', label: 'Métricas Core', icon: TrendingUp },
        { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
        { href: '/admin/revenue', label: 'Revenue', icon: PieChart },
        { href: '/admin/reviews', label: 'Reseñas', icon: Star },
        { href: '/admin/content', label: 'Contenido CMS', icon: FileText },
        { href: '/admin/templates', label: 'Plantillas Email', icon: FileText },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { href: '/admin/setup', label: 'Setup & Estado', icon: CheckCircle2 },
        { href: '/admin/ai', label: 'Configuración IA', icon: Bot },
        { href: '/admin/rbac', label: 'Permisos (RBAC)', icon: Lock },
        { href: '/admin/audit', label: 'Auditoría', icon: Activity },
      ],
    },
  ];

  function closeMenu() { setMenuOpen(false); }

  return (
    <>
      {/* 📱 CABECERA MÓVIL (Solo visible en pantallas pequeñas) */}
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 md:hidden">
        <span className="font-heading text-xl text-brand-blue tracking-wide">KCE Admin</span>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-surface-2)] text-[color:var(--color-text)] transition active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* 🌑 OVERLAY OSCURO PARA MÓVIL */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-brand-dark/40 backdrop-blur-sm transition-opacity md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* 💻 SIDEBAR PRINCIPAL (Fijo en desktop, Drawer en móvil) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)] transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          menuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Logo del Sidebar */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 md:h-20 md:px-8 border-b border-[color:var(--color-border)]">
          <Link href="/admin" onClick={closeMenu} className="font-heading text-2xl text-brand-blue tracking-wide">
            KCE Admin
          </Link>
          <button onClick={closeMenu} className="md:hidden text-[color:var(--color-text)]/50 hover:text-[color:var(--color-text)]">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Links de Navegación con Scroll */}
        <nav className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6 space-y-8">
          {groups.map((group) => {
            // Filtramos los items del grupo según los permisos del usuario
            const visibleItems = group.items.filter((it) => !access || hasCapability(access, requiredCapForHref(it.href)));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                <h4 className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                  {group.label}
                </h4>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-brand-blue/10 text-brand-blue'
                            : 'text-[color:var(--color-text)]/70 hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)]'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-brand-blue' : 'text-[color:var(--color-text)]/50'}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer del Sidebar (Botón Logout) */}
        <div className="shrink-0 border-t border-[color:var(--color-border)] p-4 bg-[color:var(--color-surface-2)]">
          <button
            onClick={logout}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 border border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            {loading ? 'Cerrando...' : 'Cerrar Sesión'}
          </button>
        </div>
      </aside>
    </>
  );
}