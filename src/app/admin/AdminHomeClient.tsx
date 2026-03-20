'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, ShoppingBag, MessageSquare, Bot,
  FileText, BarChart3, Settings, Zap, Star, Mail, 
  TrendingUp, Shield, BookOpen, DollarSign
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Ventas & Leads',
    color: 'blue',
    items: [
      { href: '/admin/command-center', icon: LayoutDashboard, label: 'Command Center', desc: 'Vista ejecutiva general' },
      { href: '/admin/leads', icon: Users, label: 'Leads', desc: 'Prospectos entrantes' },
      { href: '/admin/deals', icon: TrendingUp, label: 'Pipeline', desc: 'Deals y propuestas' },
      { href: '/admin/tasks', icon: Zap, label: 'Tareas', desc: 'Pendientes urgentes' },
    ],
  },
  {
    title: 'Operaciones',
    color: 'orange',
    items: [
      { href: '/admin/bookings', icon: ShoppingBag, label: 'Reservas', desc: 'Bookings confirmados' },
      { href: '/admin/customers', icon: Users, label: 'Clientes', desc: 'Base de clientes' },
      { href: '/admin/revenue', icon: DollarSign, label: 'Revenue', desc: 'Ingresos y pagos' },
      { href: '/admin/tickets', icon: MessageSquare, label: 'Soporte', desc: 'Tickets abiertos' },
    ],
  },
  {
    title: 'Agentes IA',
    color: 'purple',
    items: [
      { href: '/admin/agents', icon: Bot, label: 'Agentes', desc: 'Control y ejecución' },
      { href: '/admin/sequences', icon: Mail, label: 'Secuencias', desc: 'Drip emails' },
      { href: '/admin/outbound', icon: Zap, label: 'Outbound', desc: 'Mensajes salientes' },
      { href: '/admin/ai', icon: Bot, label: 'AI Lab', desc: 'Pruebas y playbook' },
    ],
  },
  {
    title: 'Contenido',
    color: 'green',
    items: [
      { href: '/admin/catalog', icon: BookOpen, label: 'Catálogo', desc: 'Tours y precios' },
      { href: '/admin/content/posts', icon: FileText, label: 'Blog', desc: 'Artículos publicados' },
      { href: '/admin/content/videos', icon: FileText, label: 'Vlog', desc: 'Videos publicados' },
      { href: '/admin/reviews', icon: Star, label: 'Reseñas', desc: 'Reviews de clientes' },
    ],
  },
  {
    title: 'Analytics',
    color: 'yellow',
    items: [
      { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', desc: 'Métricas del negocio' },
      { href: '/admin/conversations', icon: MessageSquare, label: 'Conversaciones', desc: 'Historial de chats' },
      { href: '/admin/events', icon: Zap, label: 'Eventos', desc: 'Log de actividad' },
      { href: '/admin/audit', icon: Shield, label: 'Auditoría', desc: 'Seguridad y accesos' },
    ],
  },
  {
    title: 'Sistema',
    color: 'gray',
    items: [
      { href: '/admin/setup', icon: Settings, label: 'Setup', desc: 'Checklist producción' },
      { href: '/admin/system', icon: Shield, label: 'Sistema', desc: 'Salud del servidor' },
      { href: '/api/admin/debug-ai', icon: Bot, label: 'Debug IA', desc: 'Test Gemini live' },
      { href: '/admin/affiliates', icon: Users, label: 'Afiliados', desc: 'Partners y comisiones' },
    ],
  },
];

const COLOR: Record<string, string> = {
  blue:   'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40',
  orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/40',
  purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40',
  green:  'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40',
  yellow: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-900 dark:bg-yellow-950/40',
  gray:   'border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] hover:bg-[color:var(--color-surface)]',
};

const ICON_COLOR: Record<string, string> = {
  blue: 'text-blue-600', orange: 'text-orange-600', purple: 'text-purple-600',
  green: 'text-emerald-600', yellow: 'text-yellow-600', gray: 'text-[color:var(--color-text-muted)]',
};

export default function AdminHomeClient() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-[color:var(--color-text)]">Panel de Control KCE</h1>
        <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
          Sistema operativo completo — selecciona un módulo para empezar.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
            {section.title}
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col gap-2 rounded-2xl border p-4 transition-all ${COLOR[section.color]}`}
              >
                <item.icon className={`h-5 w-5 ${ICON_COLOR[section.color]}`} />
                <div>
                  <div className="text-sm font-semibold text-[color:var(--color-text)]">{item.label}</div>
                  <div className="text-xs text-[color:var(--color-text-muted)]">{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
