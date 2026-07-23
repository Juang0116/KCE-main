'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  Globe,
  CalendarCheck,
  Target,
  MessageSquare,
  Activity,
  ExternalLink,
  ArrowLeft,
  Languages,
  ShieldCheck,
  DollarSign,
  History,
  ChevronRight,
  Sparkles,
  Copy,
  Fingerprint,
  ArrowRight,
  Terminal,
  Hash,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO DE LA BÓVEDA DE IDENTIDAD ---
type Customer = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  country: string | null;
  language: string | null;
  created_at: string;
};

type Booking = {
  id: string;
  status: 'pending' | 'paid' | 'canceled';
  stripe_session_id: string | null;
  tour_id: string | null;
  date: string;
  persons: number;
  total: number | null;
  currency: string | null;
  origin_currency: string | null;
  tour_price_minor: number | null;
  customer_email: string | null;
  customer_name: string | null;
  phone: string | null;
  created_at: string;
};

type Lead = {
  id: string;
  email: string | null;
  whatsapp: string | null;
  source: string | null;
  language: string | null;
  stage: string;
  tags: string[];
  notes: string | null;
  created_at: string;
};

type Conversation = {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  channel: string;
  locale: string;
  status: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  type: string;
  source: string | null;
  entity_id: string | null;
  dedupe_key: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type ApiResp = {
  customer: Customer;
  bookings: Booking[];
  leads: Lead[];
  conversations: Conversation[];
  events: EventRow[];
};

// --- HELPERS DE FORMATO ---
function fmtMoney(minor: number | null, currency: string | null) {
  if (minor == null || !currency) return '—';
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(0)} ${currency}`;
  }
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'paid' || s === 'won')
    return `${base} bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20`;
  if (s === 'pending' || s === 'proposal')
    return `${base} bg-amber-500/10 text-amber-700 dark:text-brand-yellow border-amber-500/20`;
  if (s === 'canceled' || s === 'lost')
    return `${base} bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20`;
  if (s === 'active' || s === 'qualified')
    return `${base} bg-brand-blue/10 text-brand-blue border-brand-blue/20`;
  return `${base} bg-surface-2 text-muted border-brand-dark/10 dark:border-white/10`;
}

export function AdminCustomerClient({ id }: { id: string }) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/customers/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || 'Falla al recuperar el perfil');
      setData(json as ApiResp);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error inesperado en el nodo de identidad');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    if (!data) return { paidCount: 0, totalSpent: 0, currency: 'EUR' };
    const paid = data.bookings.filter((b) => b.status === 'paid');
    const total = paid.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const curr = paid[0]?.currency || data.bookings[0]?.currency || 'EUR';
    return { paidCount: paid.length, totalSpent: total, currency: curr };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center space-y-8 py-40 duration-1000">
        <div className="relative">
          <Activity className="h-16 w-16 animate-pulse text-brand-blue opacity-10" />
          <Fingerprint className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-brand-blue opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-brand-blue/50">
            KCE Identity Unit
          </p>
          <p className="mt-2 text-sm font-light italic text-muted">
            Reconstruyendo Perfil 360 del Viajero...
          </p>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-[var(--radius-3xl)] border border-red-500/20 bg-red-50 p-12 text-center shadow-sm dark:bg-red-950/10">
        <ShieldCheck className="mx-auto mb-6 h-12 w-12 text-red-500/40" />
        <h2 className="font-heading text-2xl tracking-tight text-red-700 dark:text-red-400">
          Acceso Interrumpido
        </h2>
        <p className="mt-2 text-base font-light text-red-600/60 dark:text-red-400/60">
          {err || 'Registro no encontrado en el núcleo central'}
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-8 h-12 rounded-full border-red-500/20 px-8 hover:bg-red-500/10"
        >
          Reintentar Conexión
        </Button>
      </div>
    );
  }

  const { customer: c } = data;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 duration-1000">
      {/* 01. CABECERA DE IDENTIDAD (PERFIL MAESTRO) */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <Link
            href="/admin/customers"
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />{' '}
            Directorio de Viajeros
          </Link>
          <div className="flex items-center gap-6">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[2.5rem] border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
              <User className="h-12 w-12" />
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-surface bg-green-500 shadow-md">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="line-clamp-1 font-heading text-4xl leading-none tracking-tighter text-main md:text-5xl">
                {c.name || 'Viajero Identificado'}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-6 font-mono text-xs text-muted">
                {c.email && (
                  <span className="flex cursor-default items-center gap-2 transition-colors hover:text-brand-blue">
                    <Mail className="h-4 w-4 opacity-40" /> {c.email}
                  </span>
                )}
                {c.phone && (
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4 opacity-40" /> {c.phone}
                  </span>
                )}
                <span
                  className="group flex cursor-pointer items-center gap-2 opacity-40"
                  title="Copiar ID"
                >
                  <Hash className="h-4 w-4" /> {id?.slice(0, 12)}
                  <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LTV WIDGET PREMIUM */}
        <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-green-500/20 bg-green-500/5 px-10 py-8 shadow-pop transition-all hover:shadow-green-500/10">
          <div className="absolute -right-6 -top-6 opacity-[0.03] transition-transform duration-700 group-hover:scale-110">
            <DollarSign className="h-40 w-40 text-green-600" />
          </div>
          <div className="relative z-10 text-right">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-green-800/40 dark:text-green-400/30">
              Lifetime Value (LTV)
            </div>
            <div className="font-heading text-4xl tracking-tighter text-green-600 dark:text-green-400 md:text-5xl">
              {fmtMoney(stats.totalSpent, stats.currency)}
            </div>
          </div>
        </div>
      </header>

      {/* 02. SENSORES ESTRATÉGICOS (KPIs) */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Ubicación Geográfica', val: c.country || 'Sin Detectar', icon: Globe },
          { label: 'Idioma de Interfaz', val: (c.language || 'ES').toUpperCase(), icon: Languages },
          {
            label: 'Ventas Liquidadas',
            val: `${stats.paidCount} Expediciones`,
            icon: CalendarCheck,
            sub: `${data.bookings.length} procesos iniciados`,
          },
          {
            label: 'Omnicanalidad',
            val: `${data.leads.length} Orígenes`,
            icon: Target,
            sub: 'Presencia en CRM',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="group flex items-start gap-5 rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-pop dark:border-white/5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue opacity-40 shadow-inner transition-all group-hover:bg-brand-blue group-hover:text-white group-hover:opacity-100">
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                {stat.label}
              </p>
              <p className="text-base font-bold tracking-tight text-main">{stat.val}</p>
              {stat.sub && (
                <p className="mt-1 text-[10px] font-light italic text-muted opacity-60">
                  {stat.sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* 03. RELATIONAL VAULT (TOURS & SUPPORT) */}
      <div className="grid items-start gap-10 lg:grid-cols-2">
        {/* Historial de Tours */}
        <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5">
          <header className="mb-10 flex items-center justify-between border-b border-brand-dark/5 pb-6 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Expediciones
              </h2>
            </div>
            <Link
              href={`/admin/bookings?q=${c.email}`}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue transition-all hover:text-brand-dark"
            >
              Ver Todas <ChevronRight className="h-3 w-3" />
            </Link>
          </header>

          <div className="space-y-4">
            {data.bookings.length === 0 ? (
              <div className="rounded-[var(--radius-2xl)] border-2 border-dashed border-brand-dark/5 py-16 text-center text-sm font-light italic text-muted dark:border-white/5">
                Sin registros de compra activos.
              </div>
            ) : (
              data.bookings.map((b) => (
                <div
                  key={b.id}
                  className="hover:bg-surface-2/50 group relative rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-6 transition-all hover:shadow-soft dark:border-white/5"
                >
                  <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={badgeStatus(b.status)}>{b.status}</span>
                        <span className="text-sm font-bold text-main">
                          {new Date(b.date).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-muted opacity-40">
                        TRANSACTION_REF: {b.id.slice(0, 16)}
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <div className="font-heading text-2xl tracking-tight text-brand-blue">
                          {fmtMoney(b.total, b.currency)}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                          {b.persons} Viajeros
                        </div>
                      </div>
                      {b.stripe_session_id && (
                        <Link
                          href={`/admin/revenue?q=${b.stripe_session_id}`}
                          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark text-brand-yellow shadow-lg transition-all hover:scale-105 hover:bg-brand-blue hover:text-white active:scale-95"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Support & Context (Hilos de chat) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-soft dark:border-white/5">
          <header className="mb-10 flex items-center justify-between border-b border-brand-dark/5 pb-6 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-main">
                Support & Comms
              </h2>
            </div>
          </header>

          <div className="space-y-4">
            {data.conversations.length === 0 ? (
              <div className="rounded-[var(--radius-2xl)] border-2 border-dashed border-brand-dark/5 py-16 text-center text-sm font-light italic text-muted dark:border-white/5">
                Sin interacciones registradas.
              </div>
            ) : (
              data.conversations.map((cv) => (
                <Link
                  key={cv.id}
                  href={`/admin/conversations/${cv.id}`}
                  className="group block rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-6 transition-all hover:border-brand-blue/30 hover:shadow-soft dark:border-white/5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={badgeStatus(cv.status)}>{cv.status}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-main transition-colors group-hover:text-brand-blue">
                        {cv.channel}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted opacity-40">
                      {new Date(cv.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-light text-muted">
                    <span className="opacity-70">
                      {cv.closed_at
                        ? `Sesión cerrada el ${new Date(cv.closed_at).toLocaleDateString()}`
                        : 'Canal abierto • Atención prioritaria'}
                    </span>
                    <ArrowRight className="h-4 w-4 translate-x-[-8px] text-brand-blue opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 04. FORENSIC TIMELINE (ESTILO TERMINAL OSCURA) */}
      <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/20 bg-brand-dark p-2 text-white shadow-2xl">
        <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-[0.03]">
          <History className="h-80 w-80 text-brand-blue" />
        </div>

        <header className="relative z-10 flex flex-col justify-between gap-6 p-10 pb-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow text-brand-dark shadow-xl shadow-brand-yellow/10">
              <Activity className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-heading text-3xl tracking-tight">Auditoría Forense</h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/60">
                System Event Telemetry & Logs
              </p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
            Encryption: E2EE Active
          </div>
        </header>

        <div className="custom-scrollbar relative z-10 overflow-x-auto px-6 pb-12">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                  <th className="px-10 py-6">Timestamp (ISO_8601)</th>
                  <th className="px-10 py-6">Trigger Protocol</th>
                  <th className="px-10 py-6">Node Source</th>
                  <th className="px-10 py-6 text-right">Data Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {data.events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-10 py-24 text-center text-base italic text-white/10"
                    >
                      Sin trazas técnicas registradas en el periodo actual.
                    </td>
                  </tr>
                ) : (
                  data.events.map((ev) => (
                    <tr
                      key={ev.id}
                      className="group transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="whitespace-nowrap px-10 py-6 text-white/40">
                        {new Date(ev.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="px-10 py-6">
                        <span className="font-bold uppercase tracking-widest text-brand-blue">
                          {ev.type}
                        </span>
                        {ev.dedupe_key && (
                          <div className="mt-1.5 font-sans text-[9px] opacity-20">
                            DUPLICATE_BLOCK: {ev.dedupe_key.slice(0, 32)}...
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-6 uppercase tracking-widest text-green-400/60">
                        {ev.source || 'Kernel'}
                      </td>
                      <td className="px-10 py-6 text-right">
                        {ev.payload && Object.keys(ev.payload).length > 0 ? (
                          <details className="group/payload inline-block text-left">
                            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-white/20">
                              <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Inspeccionar
                              Payload
                            </summary>
                            {/* Modal Overlay Style */}
                            <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/90 p-6 opacity-0 backdrop-blur-md transition-opacity duration-300 group-open/payload:pointer-events-auto group-open/payload:opacity-100">
                              <div className="relative w-full max-w-3xl translate-y-8 rounded-[3rem] border border-white/10 bg-[#0a0a0a] p-12 shadow-2xl transition-transform duration-500 group-open/payload:translate-y-0">
                                <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-8">
                                  <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/20">
                                      <Database className="h-6 w-6 text-brand-blue" />
                                    </div>
                                    <div>
                                      <h3 className="font-heading text-2xl tracking-tight text-white">
                                        Event Metadata
                                      </h3>
                                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                                        OBJECT_ID: {ev.id}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="h-3 w-3 animate-pulse rounded-full bg-brand-yellow shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                                </div>
                                <pre className="custom-scrollbar max-h-[500px] overflow-auto rounded-[2rem] border border-white/5 bg-black/50 p-10 text-left font-mono text-[12px] leading-relaxed text-emerald-400/90 selection:bg-brand-blue/30">
                                  {JSON.stringify(ev.payload, null, 4)}
                                </pre>
                                <div className="mt-10 flex items-center justify-between">
                                  <p className="text-[10px] uppercase italic tracking-[0.6em] text-white/10">
                                    Knowing Cultures Forensic Engine v4.2
                                  </p>
                                  <button
                                    className="h-12 rounded-full border border-white/10 bg-white/5 px-8 text-[10px] font-bold uppercase tracking-widest text-white/60 shadow-lg transition-all hover:bg-white/10 hover:text-white"
                                    onClick={(e) => {
                                      const details = (e.currentTarget as HTMLElement).closest(
                                        'details',
                                      );
                                      if (details) details.open = false;
                                    }}
                                  >
                                    Cerrar Inspección
                                  </button>
                                </div>
                              </div>
                            </div>
                          </details>
                        ) : (
                          <span className="text-[9px] uppercase tracking-widest text-white/10">
                            No Data Available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FOOTER DE CONFORMIDAD CORPORATIVA */}
      <footer className="flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> GDPR Data Sovereignty
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4" /> Root Identity Node v5.1
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Sparkles className="h-4 w-4 text-brand-yellow" /> Zero-Restart Context
        </div>
      </footer>
    </div>
  );
}
