'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { User, Mail, Phone, Globe, CalendarCheck, Target, MessageSquare, Activity, ExternalLink, ArrowLeft, Languages } from 'lucide-react';

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
  payload: any;
  created_at: string;
};

type ApiResp = {
  customer: Customer;
  bookings: Booking[];
  leads: Lead[];
  conversations: Conversation[];
  events: EventRow[];
  requestId?: string;
  error?: string;
};

function fmtMoney(minor: number | null, currency: string | null) {
  if (minor == null || !currency) return '—';
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(0)} ${currency}`;
  }
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (s === 'paid' || s === 'won') return `${base} bg-emerald-500/10 text-emerald-700 border-emerald-500/20`;
  if (s === 'pending' || s === 'proposal') return `${base} bg-amber-500/10 text-amber-700 border-amber-500/20`;
  if (s === 'canceled' || s === 'lost') return `${base} bg-rose-500/10 text-rose-700 border-rose-500/20`;
  if (s === 'active' || s === 'qualified') return `${base} bg-brand-blue/10 text-brand-blue border-brand-blue/20`;
  return `${base} bg-[var(--color-surface-2)] text-[var(--color-text)]/70 border-[var(--color-border)]`;
}

export function AdminCustomerClient({ id }: { id: string }) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const paidCount = useMemo(() => {
    const bookings = data?.bookings ?? [];
    return bookings.filter((b) => b.status === 'paid').length;
  }, [data]);

  const totalSpent = useMemo(() => {
    return (data?.bookings ?? []).filter((b) => b.status === 'paid').reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [data]);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/customers/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const json = (await resp.json().catch(() => null)) as ApiResp | null;
      if (!resp.ok) throw new Error(json?.error || 'Error cargando customer');
      setData(json);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-[var(--color-text)]/40">
        <Activity className="h-8 w-8 animate-spin text-brand-blue mb-4 opacity-50" />
        <p className="text-sm font-bold uppercase tracking-widest">Recopilando Perfil 360...</p>
      </div>
    );
  }

  if (err) {
    return <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm font-medium text-red-700">Error: {err}</div>;
  }

  if (!data) return null;

  const c = data.customer;
  const currency = data.bookings.find(b => b.status === 'paid')?.currency || 'EUR';

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header y Breadcrumb */}
      <div>
        <Link href="/admin/customers" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Volver al Directorio
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-3xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0 border border-brand-blue/20">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl text-[var(--color-text)]">{c.name || 'Cliente Sin Nombre'}</h1>
              <div className="mt-1.5 flex items-center gap-3 text-sm text-[var(--color-text)]/60 font-mono">
                {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {c.email}</span>}
                {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {c.phone}</span>}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 px-6 py-4 text-right shadow-sm shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/60 mb-1">Lifetime Value</div>
            <div className="font-heading text-3xl text-emerald-600">{fmtMoney(totalSpent, currency)}</div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Metadatos */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm flex items-center gap-3">
          <Globe className="h-8 w-8 text-[var(--color-text)]/20" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Ubicación</div>
            <div className="text-base font-semibold text-[var(--color-text)]">{c.country || 'Desconocida'}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm flex items-center gap-3">
          <Languages className="h-8 w-8 text-[var(--color-text)]/20" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Idioma</div>
            <div className="text-base font-semibold text-[var(--color-text)] uppercase">{c.language || 'N/A'}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm flex items-center gap-3">
          <CalendarCheck className="h-8 w-8 text-[var(--color-text)]/20" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Reservas</div>
            <div className="text-base font-semibold text-brand-blue">{paidCount} pagadas <span className="text-xs text-[var(--color-text)]/40 font-normal">/ {data.bookings.length}</span></div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm flex items-center gap-3">
          <Target className="h-8 w-8 text-[var(--color-text)]/20" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Leads Previos</div>
            <div className="text-base font-semibold text-[var(--color-text)]">{data.leads.length} orígenes</div>
          </div>
        </div>
      </div>

      {/* Grillas de Datos Relacionados */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Reservas */}
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Reservas</h2>
            </div>
            <Link href={`/admin/bookings?q=${c.email}`} className="text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:underline">Ver Todas →</Link>
          </div>
          
          <div className="space-y-3">
            {data.bookings.length === 0 ? <div className="text-sm text-[var(--color-text)]/40 italic">Sin reservas.</div> : null}
            {data.bookings.map((b) => (
              <div key={b.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-brand-blue/30">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={badgeStatus(b.status)}>{b.status}</span>
                    <span className="font-semibold text-[var(--color-text)]">{b.date}</span>
                  </div>
                  <div className="text-xs text-[var(--color-text)]/60 font-mono">Session: {b.stripe_session_id?.slice(0, 12) || '—'}</div>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <div className="font-heading text-lg text-[var(--color-text)]">{fmtMoney(b.total, b.currency)}</div>
                    <div className="text-[10px] uppercase font-bold text-[var(--color-text)]/40">{b.persons} PAX</div>
                  </div>
                  {b.stripe_session_id && (
                    <Link href={`/booking/${encodeURIComponent(b.stripe_session_id)}`} target="_blank" className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark text-brand-yellow transition hover:scale-105 shadow-sm" title="Abrir Ticket">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conversaciones */}
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Soporte & Chat</h2>
            </div>
            <Link href={`/admin/conversations?q=${c.email}`} className="text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:underline">Ver Bandeja →</Link>
          </div>

          <div className="space-y-3">
            {data.conversations.length === 0 ? <div className="text-sm text-[var(--color-text)]/40 italic">Sin conversaciones de soporte.</div> : null}
            {data.conversations.map((cv) => (
              <Link key={cv.id} href={`/admin/conversations/${cv.id}`} className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 transition hover:border-brand-blue/30 group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={badgeStatus(cv.status)}>{cv.status}</span>
                    <span className="text-xs font-semibold text-[var(--color-text)] capitalize group-hover:text-brand-blue transition-colors">{cv.channel}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-text)]/40">{new Date(cv.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="text-xs text-[var(--color-text)]/60">
                  {cv.closed_at ? `Cerrado el ${new Date(cv.closed_at).toLocaleDateString('es-ES')}` : 'Hilo Abierto (Requiere Atención)'}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Leads Asociados */}
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Orígenes de Lead (Pre-compra)</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                  <th className="px-5 py-4">Fuente</th>
                  <th className="px-5 py-4 text-center">Etapa CRM</th>
                  <th className="px-5 py-4 text-center">Intereses (Tags)</th>
                  <th className="px-5 py-4 text-right">Fecha de Captura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {data.leads.length === 0 ? <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[var(--color-text)]/40 italic">Sin orígenes registrados.</td></tr> : null}
                {data.leads.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-5 py-4 font-mono text-xs text-brand-blue">{l.source || 'Directo'}</td>
                    <td className="px-5 py-4 text-center"><span className={badgeStatus(l.stage)}>{l.stage}</span></td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {(l.tags || []).map(t => <span key={t} className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-text)]/60">{t}</span>)}
                        {l.tags.length === 0 && <span className="text-[var(--color-text)]/30">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-[var(--color-text)]/60">{new Date(l.created_at).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Historial de Eventos del Sistema */}
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Eventos del Sistema (Timeline)</h2>
            </div>
            <Link href={`/admin/events?entity_id=${id}`} className="text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:underline">Auditoría Forense →</Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                  <th className="px-5 py-4">Fecha (ISO)</th>
                  <th className="px-5 py-4">Tipo de Evento</th>
                  <th className="px-5 py-4">Origen</th>
                  <th className="px-5 py-4 text-right">Datos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {data.events.length === 0 ? <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[var(--color-text)]/40 italic">Sin eventos técnicos.</td></tr> : null}
                {data.events.map((ev) => (
                  <tr key={ev.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-5 py-4 align-top text-[10px] font-mono text-[var(--color-text)]/50">{new Date(ev.created_at).toISOString().replace('T', ' ').slice(0, 19)}</td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-semibold text-[var(--color-text)]">{ev.type}</span>
                      {ev.dedupe_key && <div className="text-[9px] uppercase tracking-widest font-mono text-[var(--color-text)]/40 mt-1 max-w-[150px] truncate" title={ev.dedupe_key}>Key: {ev.dedupe_key}</div>}
                    </td>
                    <td className="px-5 py-4 align-top text-xs text-brand-blue">{ev.source || '—'}</td>
                    <td className="px-5 py-4 align-top text-right">
                      {ev.payload && Object.keys(ev.payload).length > 0 ? (
                        <details className="group inline-block text-left cursor-pointer">
                          <summary className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70 hover:bg-[var(--color-border)] transition-colors list-none">
                            Ver JSON
                          </summary>
                          <div className="mt-2 w-full max-w-[400px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                            <pre className="max-h-[200px] overflow-auto p-3 text-[10px] font-mono text-[var(--color-text)]/80 leading-relaxed">
                              {JSON.stringify(ev.payload, null, 2)}
                            </pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/30">— Empty —</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}