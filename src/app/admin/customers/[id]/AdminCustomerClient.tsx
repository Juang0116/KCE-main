'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  User, Mail, Phone, Globe, CalendarCheck, Target, 
  MessageSquare, Activity, ExternalLink, ArrowLeft, 
  Languages, ShieldCheck, DollarSign, History, 
  ChevronRight, Sparkles, Copy, Fingerprint,
  ArrowRight 
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
  if (s === 'paid' || s === 'won') return `${base} bg-emerald-500/10 text-emerald-700 border-emerald-500/20`;
  if (s === 'pending' || s === 'proposal') return `${base} bg-amber-500/10 text-amber-700 border-amber-500/20`;
  if (s === 'canceled' || s === 'lost') return `${base} bg-rose-500/10 text-rose-700 border-rose-500/20`;
  if (s === 'active' || s === 'qualified') return `${base} bg-brand-blue/10 text-brand-blue border-brand-blue/20`;
  return `${base} bg-[color:var(--color-surface-2)] text-[color:var(--color-text-muted)] border-[color:var(--color-border)]`;
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
      <div className="py-32 flex flex-col items-center justify-center space-y-6 animate-pulse">
        <div className="relative">
          <Activity className="h-12 w-12 text-brand-blue opacity-20" />
          <Fingerprint className="h-6 w-6 text-brand-blue absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/40">KCE Identity Unit</p>
          <p className="text-sm font-light italic text-[color:var(--color-text)]/30 mt-2">Reconstruyendo Perfil 360...</p>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-8 text-center max-w-2xl mx-auto">
        <ShieldCheck className="h-10 w-10 text-rose-500/40 mx-auto mb-4" />
        <h2 className="font-heading text-xl text-rose-700">Acceso Interrumpido</h2>
        <p className="text-sm text-rose-600/60 mt-2">{err || 'Registro no encontrado en el núcleo'}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-6 rounded-full">Reintentar Conexión</Button>
      </div>
    );
  }

  const { customer: c } = data;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE IDENTIDAD (DINÁMICA) */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[color:var(--color-border)] pb-10">
        <div className="space-y-4">
          <Link href="/admin/customers" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors">
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Directorio Maestro
          </Link>
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner relative">
              <User className="h-10 w-10" />
              <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-sm">
                 <ShieldCheck className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight line-clamp-1">{c.name || 'Viajero Identificado'}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-[color:var(--color-text-muted)]">
                {c.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {c.email}</span>}
                {c.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {c.phone}</span>}
                <span className="flex items-center gap-1.5 opacity-50"><Copy className="h-3 w-3 cursor-pointer hover:text-brand-blue" /> ID: {id?.slice(0,12)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/[0.03] px-8 py-6 shadow-xl transition-all hover:shadow-emerald-500/10">
           <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform">
              <DollarSign className="h-32 w-32 text-emerald-600" />
           </div>
           <div className="relative z-10 text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-800/40 mb-2">Lifetime Value (LTV)</div>
              <div className="font-heading text-4xl text-emerald-600">{fmtMoney(stats.totalSpent, stats.currency)}</div>
           </div>
        </div>
      </header>

      {/* 02. SENSORES ESTRATÉGICOS */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Ubicación', val: c.country || 'Desconocida', icon: Globe },
          { label: 'Preferencia Idioma', val: (c.language || 'ES').toUpperCase(), icon: Languages },
          { label: 'Reservas Pagadas', val: `${stats.paidCount} Tours`, icon: CalendarCheck, sub: `${data.bookings.length} intentos` },
          { label: 'Calificación Lead', val: `${data.leads.length} Canales`, icon: Target, sub: 'Origen omnicanal' }
        ].map((stat, i) => (
          <div key={i} className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm flex items-start gap-4 group hover:border-brand-blue/20 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-brand-blue/5 text-brand-blue/30 flex items-center justify-center shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-all">
               <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/30 mb-1">{stat.label}</p>
              <p className="text-base font-bold text-[color:var(--color-text)]">{stat.val}</p>
              {stat.sub && <p className="text-[10px] font-light text-[color:var(--color-text-muted)] mt-0.5 italic">{stat.sub}</p>}
            </div>
          </div>
        ))}
      </section>

      {/* 03. RELATIONAL VAULT */}
      <div className="grid gap-10 lg:grid-cols-2 items-start">
        <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-2xl overflow-hidden relative">
          <header className="flex items-center justify-between mb-8 border-b border-[color:var(--color-border)] pb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-brand-blue/5 text-brand-blue flex items-center justify-center shadow-inner">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-brand-blue uppercase tracking-tight">Historial de Tours</h2>
            </div>
            <Link href={`/admin/bookings?q=${c.email}`} className="text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:text-brand-blue flex items-center gap-1 transition-colors">
              Explorar Todos <ChevronRight className="h-3 w-3" />
            </Link>
          </header>
          
          <div className="space-y-4">
            {data.bookings.length === 0 ? (
              <div className="py-12 text-center text-sm font-light text-[color:var(--color-text)]/50 italic border-2 border-dashed border-[color:var(--color-border)] rounded-[2rem]">Sin registros de compra.</div>
            ) : (
              data.bookings.map((b) => (
                <div key={b.id} className="group relative rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition-all hover:shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={badgeStatus(b.status)}>{b.status}</span>
                        <span className="text-sm font-bold text-[color:var(--color-text)]">{new Date(b.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[color:var(--color-text)]/30 uppercase tracking-tighter">REF: {b.id.slice(0,14)}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-heading text-xl text-brand-blue">{fmtMoney(b.total, b.currency)}</div>
                        <div className="text-[9px] font-bold uppercase text-[color:var(--color-text-muted)] tracking-widest">{b.persons} Viajeros</div>
                      </div>
                      {b.stripe_session_id && (
                        <Link href={`/admin/revenue?q=${b.stripe_session_id}`} className="h-12 w-12 rounded-2xl bg-brand-dark text-brand-yellow flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
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

        <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm">
          <header className="flex items-center justify-between mb-8 border-b border-[color:var(--color-border)] pb-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-brand-blue/5 text-brand-blue flex items-center justify-center shadow-inner">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-brand-blue uppercase tracking-tight">Support & Context</h2>
            </div>
          </header>

          <div className="space-y-3">
            {data.conversations.length === 0 ? (
              <div className="py-12 text-center text-sm font-light text-[color:var(--color-text)]/50 italic border-2 border-dashed border-[color:var(--color-border)] rounded-[2rem]">Sin interacciones previas.</div>
            ) : (
              data.conversations.map((cv) => (
                <Link key={cv.id} href={`/admin/conversations/${cv.id}`} className="block rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition-all hover:border-brand-blue/30 group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                       <span className={badgeStatus(cv.status)}>{cv.status}</span>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)] group-hover:text-brand-blue transition-colors">{cv.channel}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[color:var(--color-text)]/30">{new Date(cv.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-light text-[color:var(--color-text)]/50">
                    <span>{cv.closed_at ? `Hilo cerrado: ${new Date(cv.closed_at).toLocaleDateString()}` : 'Hilo activo (Atención prioritaria)'}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 04. FORENSIC TIMELINE */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-brand-dark p-2 shadow-2xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-[0.05]">
           <History className="h-64 w-64 text-brand-blue" />
        </div>
        
        <header className="p-10 pb-6 flex items-center justify-between relative z-10">
           <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-brand-yellow text-[color:var(--color-text)] flex items-center justify-center shadow-lg shadow-brand-yellow/10">
                <Activity className="h-6 w-6" />
             </div>
             <div>
                <h2 className="font-heading text-3xl">Auditoría Forense</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/60">System Event Timeline</p>
             </div>
           </div>
        </header>

        <div className="overflow-x-auto px-6 pb-10 relative z-10">
           <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
             <table className="w-full text-left text-sm min-w-[900px]">
               <thead className="bg-white/5 border-b border-white/10">
                 <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                   <th className="px-8 py-6">Timestamp (ISO)</th>
                   <th className="px-8 py-6">Tipo de Disparador</th>
                   <th className="px-8 py-6">Fuente del Nodo</th>
                   <th className="px-8 py-6 text-right">Integridad de Datos</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                 {data.events.length === 0 ? (
                   <tr><td colSpan={4} className="px-8 py-16 text-center text-white/20 italic">Sin trazas técnicas registradas.</td></tr>
                 ) : (
                   data.events.map((ev) => (
                     <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="px-8 py-6 text-white/40">{new Date(ev.created_at).toISOString().replace('T', ' ').slice(0, 19)}</td>
                       <td className="px-8 py-6">
                          <span className="font-bold text-brand-blue uppercase tracking-tighter">{ev.type}</span>
                          {ev.dedupe_key && <div className="text-[9px] opacity-20 mt-1">Dedupe: {ev.dedupe_key.slice(0,24)}...</div>}
                       </td>
                       <td className="px-8 py-6 text-emerald-400 opacity-60 uppercase">{ev.source || 'Kernel'}</td>
                       <td className="px-8 py-6 text-right">
                          {ev.payload && Object.keys(ev.payload).length > 0 ? (
                            <details className="group/payload inline-block text-left">
                              <summary className="cursor-pointer list-none rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                                <Sparkles className="h-3 w-3" /> Ver Payload
                              </summary>
                              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 pointer-events-none group-open/payload:pointer-events-auto opacity-0 group-open/payload:opacity-100 transition-opacity">
                                <div className="w-full max-w-2xl bg-brand-dark border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative translate-y-4 group-open/payload:translate-y-0 transition-transform">
                                   <div className="mb-6 flex items-center justify-between">
                                      <h3 className="font-heading text-xl text-white">Event Object <span className="text-brand-blue font-mono text-xs opacity-50">#{ev.id.slice(0,8)}</span></h3>
                                      <div className="h-2 w-2 rounded-full bg-brand-yellow animate-pulse" />
                                   </div>
                                   <pre className="max-h-[500px] overflow-auto custom-scrollbar p-6 rounded-2xl bg-black/30 border border-white/5 text-[10px] leading-relaxed text-emerald-400 font-mono text-left">
                                     {JSON.stringify(ev.payload, null, 2)}
                                   </pre>
                                   <p className="mt-6 text-[9px] text-center uppercase tracking-[0.5em] text-white/20 italic">KCE Forensics Unit · MMXXVI</p>
                                   <div className="mt-4 flex justify-end">
                                      <button className="text-[10px] font-bold uppercase text-white/40 hover:text-white" onClick={(e) => {
                                        const details = (e.target as HTMLElement).closest('details');
                                        if (details) details.open = false;
                                      }}>Cerrar Inspección</button>
                                   </div>
                                </div>
                              </div>
                            </details>
                          ) : <span className="opacity-10">—</span>}
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </section>

      {/* FOOTER DE CONFORMIDAD */}
      <footer className="pt-10 flex flex-wrap items-center justify-center gap-12 border-t border-[color:var(--color-border)] opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> GDPR Data Sovereignty
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Zero-Restart Context
        </div>
      </footer>
    </div>
  );
}