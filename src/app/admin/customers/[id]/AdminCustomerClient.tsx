'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  User, Mail, Phone, Globe, CalendarCheck, Target, 
  MessageSquare, Activity, ExternalLink, ArrowLeft, 
  Languages, ShieldCheck, DollarSign, History, 
  ChevronRight, Sparkles, Copy, Fingerprint,
  ArrowRight, Terminal, Hash, Database
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
      maximumFractionDigits: 0 
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(0)} ${currency}`;
  }
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'paid' || s === 'won') return `${base} bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20`;
  if (s === 'pending' || s === 'proposal') return `${base} bg-amber-500/10 text-amber-700 dark:text-brand-yellow border-amber-500/20`;
  if (s === 'canceled' || s === 'lost') return `${base} bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20`;
  if (s === 'active' || s === 'qualified') return `${base} bg-brand-blue/10 text-brand-blue border-brand-blue/20`;
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
      const resp = await adminFetch(`/api/admin/customers/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || 'Falla al recuperar el perfil');
      setData(json as ApiResp);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error inesperado en el nodo de identidad');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    if (!data) return { paidCount: 0, totalSpent: 0, currency: 'EUR' };
    const paid = data.bookings.filter(b => b.status === 'paid');
    const total = paid.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const curr = paid[0]?.currency || data.bookings[0]?.currency || 'EUR';
    return { paidCount: paid.length, totalSpent: total, currency: curr };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
        <div className="relative">
          <Activity className="h-16 w-16 text-brand-blue opacity-10 animate-pulse" />
          <Fingerprint className="h-8 w-8 text-brand-blue absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-brand-blue/50">KCE Identity Unit</p>
          <p className="text-sm font-light italic text-muted mt-2">Reconstruyendo Perfil 360 del Viajero...</p>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="rounded-[var(--radius-3xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-12 text-center max-w-2xl mx-auto shadow-sm">
        <ShieldCheck className="h-12 w-12 text-red-500/40 mx-auto mb-6" />
        <h2 className="font-heading text-2xl text-red-700 dark:text-red-400 tracking-tight">Acceso Interrumpido</h2>
        <p className="text-base text-red-600/60 dark:text-red-400/60 mt-2 font-light">{err || 'Registro no encontrado en el núcleo central'}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-8 rounded-full h-12 px-8 border-red-500/20 hover:bg-red-500/10">Reintentar Conexión</Button>
      </div>
    );
  }

  const { customer: c } = data;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE IDENTIDAD (PERFIL MAESTRO) */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <Link href="/admin/customers" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-brand-blue transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Directorio de Viajeros
          </Link>
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-[2.5rem] bg-brand-blue/10 border border-brand-blue/5 flex items-center justify-center text-brand-blue shadow-inner relative">
              <User className="h-12 w-12" />
              <div className="absolute -right-1 -bottom-1 h-8 w-8 rounded-full bg-green-500 border-4 border-surface flex items-center justify-center shadow-md">
                 <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tighter leading-none line-clamp-1">{c.name || 'Viajero Identificado'}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-6 text-xs font-mono text-muted">
                {c.email && <span className="flex items-center gap-2 hover:text-brand-blue transition-colors cursor-default"><Mail className="h-4 w-4 opacity-40" /> {c.email}</span>}
                {c.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4 opacity-40" /> {c.phone}</span>}
                <span className="flex items-center gap-2 opacity-40 group cursor-pointer" title="Copiar ID">
                   <Hash className="h-4 w-4" /> {id?.slice(0,12)}
                   <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LTV WIDGET PREMIUM */}
        <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-green-500/20 bg-green-500/5 px-10 py-8 shadow-pop transition-all hover:shadow-green-500/10">
           <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <DollarSign className="h-40 w-40 text-green-600" />
           </div>
           <div className="relative z-10 text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-green-800/40 dark:text-green-400/30 mb-3">Lifetime Value (LTV)</div>
              <div className="font-heading text-4xl md:text-5xl text-green-600 dark:text-green-400 tracking-tighter">{fmtMoney(stats.totalSpent, stats.currency)}</div>
           </div>
        </div>
      </header>

      {/* 02. SENSORES ESTRATÉGICOS (KPIs) */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Ubicación Geográfica', val: c.country || 'Sin Detectar', icon: Globe },
          { label: 'Idioma de Interfaz', val: (c.language || 'ES').toUpperCase(), icon: Languages },
          { label: 'Ventas Liquidadas', val: `${stats.paidCount} Expediciones`, icon: CalendarCheck, sub: `${data.bookings.length} procesos iniciados` },
          { label: 'Omnicanalidad', val: `${data.leads.length} Orígenes`, icon: Target, sub: 'Presencia en CRM' }
        ].map((stat, i) => (
          <div key={i} className="rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-6 shadow-soft flex items-start gap-5 group hover:shadow-pop hover:-translate-y-1 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/5 text-brand-blue opacity-40 flex items-center justify-center shrink-0 group-hover:bg-brand-blue group-hover:text-white group-hover:opacity-100 transition-all shadow-inner">
               <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted mb-1.5 opacity-60">{stat.label}</p>
              <p className="text-base font-bold text-main tracking-tight">{stat.val}</p>
              {stat.sub && <p className="text-[10px] font-light text-muted mt-1 italic opacity-60">{stat.sub}</p>}
            </div>
          </div>
        ))}
      </section>

      {/* 03. RELATIONAL VAULT (TOURS & SUPPORT) */}
      <div className="grid gap-10 lg:grid-cols-2 items-start">
        
        {/* Historial de Tours */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop relative overflow-hidden">
          <header className="flex items-center justify-between mb-10 border-b border-brand-dark/5 dark:border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shadow-inner">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Expediciones</h2>
            </div>
            <Link href={`/admin/bookings?q=${c.email}`} className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue hover:text-brand-dark flex items-center gap-2 transition-all">
              Ver Todas <ChevronRight className="h-3 w-3" />
            </Link>
          </header>
          
          <div className="space-y-4">
            {data.bookings.length === 0 ? (
              <div className="py-16 text-center text-sm font-light text-muted italic border-2 border-dashed border-brand-dark/5 dark:border-white/5 rounded-[var(--radius-2xl)]">
                Sin registros de compra activos.
              </div>
            ) : (
              data.bookings.map((b) => (
                <div key={b.id} className="group relative rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-6 transition-all hover:shadow-soft hover:bg-surface-2/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={badgeStatus(b.status)}>{b.status}</span>
                        <span className="text-sm font-bold text-main">{new Date(b.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="text-[9px] font-mono text-muted uppercase tracking-widest opacity-40">TRANSACTION_REF: {b.id.slice(0,16)}</div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <div className="font-heading text-2xl text-brand-blue tracking-tight">{fmtMoney(b.total, b.currency)}</div>
                        <div className="text-[9px] font-bold uppercase text-muted tracking-[0.2em] opacity-60">{b.persons} Viajeros</div>
                      </div>
                      {b.stripe_session_id && (
                        <Link href={`/admin/revenue?q=${b.stripe_session_id}`} className="h-12 w-12 rounded-2xl bg-brand-dark text-brand-yellow flex items-center justify-center hover:bg-brand-blue hover:text-white hover:scale-105 transition-all shadow-lg active:scale-95">
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
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-soft">
          <header className="flex items-center justify-between mb-10 border-b border-brand-dark/5 dark:border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shadow-inner">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Support & Comms</h2>
            </div>
          </header>

          <div className="space-y-4">
            {data.conversations.length === 0 ? (
              <div className="py-16 text-center text-sm font-light text-muted italic border-2 border-dashed border-brand-dark/5 dark:border-white/5 rounded-[var(--radius-2xl)]">
                Sin interacciones registradas.
              </div>
            ) : (
              data.conversations.map((cv) => (
                <Link key={cv.id} href={`/admin/conversations/${cv.id}`} className="block rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-6 transition-all hover:shadow-soft hover:border-brand-blue/30 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <span className={badgeStatus(cv.status)}>{cv.status}</span>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-main group-hover:text-brand-blue transition-colors">{cv.channel}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted opacity-40">{new Date(cv.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-light text-muted">
                    <span className="opacity-70">{cv.closed_at ? `Sesión cerrada el ${new Date(cv.closed_at).toLocaleDateString()}` : 'Canal abierto • Atención prioritaria'}</span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-8px] group-hover:translate-x-0 text-brand-blue" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 04. FORENSIC TIMELINE (ESTILO TERMINAL OSCURA) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/20 bg-brand-dark p-2 shadow-2xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
           <History className="h-80 w-80 text-brand-blue" />
        </div>
        
        <header className="p-10 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
           <div className="flex items-center gap-5">
             <div className="h-14 w-14 rounded-2xl bg-brand-yellow text-brand-dark flex items-center justify-center shadow-xl shadow-brand-yellow/10">
                <Activity className="h-7 w-7" />
             </div>
             <div>
                <h2 className="font-heading text-3xl tracking-tight">Auditoría Forense</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/60 mt-1">System Event Telemetry & Logs</p>
             </div>
           </div>
           <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
             Encryption: E2EE Active
           </div>
        </header>

        <div className="overflow-x-auto custom-scrollbar px-6 pb-12 relative z-10">
           <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
             <table className="w-full text-left text-sm min-w-[1000px]">
               <thead className="bg-white/5 border-b border-white/10">
                 <tr className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                   <th className="px-10 py-6">Timestamp (ISO_8601)</th>
                   <th className="px-10 py-6">Trigger Protocol</th>
                   <th className="px-10 py-6">Node Source</th>
                   <th className="px-10 py-6 text-right">Data Integrity</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                 {data.events.length === 0 ? (
                   <tr><td colSpan={4} className="px-10 py-24 text-center text-white/10 italic text-base">Sin trazas técnicas registradas en el periodo actual.</td></tr>
                 ) : (
                   data.events.map((ev) => (
                     <tr key={ev.id} className="hover:bg-white/[0.03] transition-colors group">
                       <td className="px-10 py-6 text-white/40 whitespace-nowrap">{new Date(ev.created_at).toISOString().replace('T', ' ').slice(0, 19)}</td>
                       <td className="px-10 py-6">
                          <span className="font-bold text-brand-blue uppercase tracking-widest">{ev.type}</span>
                          {ev.dedupe_key && <div className="text-[9px] opacity-20 mt-1.5 font-sans">DUPLICATE_BLOCK: {ev.dedupe_key.slice(0,32)}...</div>}
                       </td>
                       <td className="px-10 py-6 text-green-400/60 uppercase tracking-widest">{ev.source || 'Kernel'}</td>
                       <td className="px-10 py-6 text-right">
                          {ev.payload && Object.keys(ev.payload).length > 0 ? (
                            <details className="group/payload inline-block text-left">
                              <summary className="cursor-pointer list-none rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-3 shadow-sm">
                                 <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Inspeccionar Payload
                              </summary>
                              {/* Modal Overlay Style */}
                              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/90 backdrop-blur-md p-6 pointer-events-none group-open/payload:pointer-events-auto opacity-0 group-open/payload:opacity-100 transition-opacity duration-300">
                                <div className="w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-12 shadow-2xl relative translate-y-8 group-open/payload:translate-y-0 transition-transform duration-500">
                                   <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-8">
                                      <div className="flex items-center gap-4">
                                         <div className="h-12 w-12 rounded-2xl bg-brand-blue/20 flex items-center justify-center">
                                            <Database className="h-6 w-6 text-brand-blue" />
                                         </div>
                                         <div>
                                            <h3 className="font-heading text-2xl text-white tracking-tight">Event Metadata</h3>
                                            <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mt-1">OBJECT_ID: {ev.id}</p>
                                         </div>
                                      </div>
                                      <div className="h-3 w-3 rounded-full bg-brand-yellow animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                                   </div>
                                   <pre className="max-h-[500px] overflow-auto custom-scrollbar p-10 rounded-[2rem] bg-black/50 border border-white/5 text-[12px] leading-relaxed text-emerald-400/90 font-mono text-left selection:bg-brand-blue/30">
                                     {JSON.stringify(ev.payload, null, 4)}
                                   </pre>
                                   <div className="mt-10 flex items-center justify-between">
                                      <p className="text-[10px] uppercase tracking-[0.6em] text-white/10 italic">Knowing Cultures Forensic Engine v4.2</p>
                                      <button className="h-12 px-8 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-lg" onClick={(e) => {
                                        const details = (e.currentTarget as HTMLElement).closest('details');
                                        if (details) details.open = false;
                                      }}>Cerrar Inspección</button>
                                   </div>
                                </div>
                              </div>
                            </details>
                          ) : <span className="text-white/10 uppercase tracking-widest text-[9px]">No Data Available</span>}
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
      <footer className="pt-16 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> GDPR Data Sovereignty
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4" /> Root Identity Node v5.1
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Sparkles className="h-4 w-4 text-brand-yellow" /> Zero-Restart Context
        </div>
      </footer>

    </div>
  );
}