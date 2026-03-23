'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Mail, MessageCircle, Send, Search, RefreshCw, 
  Copy, CheckCircle2, Bot, AlertCircle, 
  ArrowRight, ExternalLink, Filter, 
  Clock, Zap, Check, X, Smartphone,
  ShieldCheck, Terminal, Radio, Activity,
  Database, Hash, ChevronRight, Layout,
  UserCheck, 
  Target,  // ✅ Añadido
  XCircle  // ✅ Añadido
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';

type OutboundStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'failed' | 'canceled';
type OutboundChannel = 'whatsapp' | 'email';

type OutboundRow = {
  id: string;
  deal_id: string | null;
  ticket_id: string | null;
  channel: OutboundChannel;
  provider: string;
  status: OutboundStatus;
  to_email: string | null;
  to_phone: string | null;
  subject: string | null;
  body: string;
  template_key: string | null;
  template_variant: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  outcome: 'none' | 'replied' | 'paid' | 'lost';
  replied_at: string | null;
  replied_note: string | null;
  attributed_won_at: string | null;
  attributed_booking_id: string | null;
};

// --- HELPERS ---
function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'sent') return `${base} border-green-500/20 bg-green-500/5 text-green-600`;
  if (s === 'queued') return `${base} border-brand-yellow/20 bg-brand-yellow/5 text-brand-yellow animate-pulse`;
  if (s === 'failed') return `${base} border-red-500/40 bg-red-500/5 text-red-600`;
  return `${base} border-brand-dark/10 bg-surface-2 text-muted`;
}

function badgeOutcome(outcome: string) {
  const o = (outcome || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (o === 'paid') return `${base} bg-brand-blue text-white border-brand-blue drop-shadow-md`;
  if (o === 'replied') return `${base} border-green-500/30 bg-green-500/5 text-green-700`;
  if (o === 'lost') return `${base} border-red-500/30 bg-red-500/5 text-red-600`;
  return `${base} border-brand-dark/10 bg-transparent text-muted opacity-40`;
}

export function AdminOutboundClient() {
  const [items, setItems] = useState<OutboundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [status, setStatus] = useState<OutboundStatus | ''>('');
  const [outcome, setOutcome] = useState<OutboundRow['outcome'] | ''>('');
  const [q, setQ] = useState('');
  const [dealId, setDealId] = useState('');
  const [ticketId, setTicketId] = useState('');

  const load = useCallback(async () => {
    setMsg('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (q.trim()) params.set('q', q.trim());
      if (dealId.trim()) params.set('deal_id', dealId.trim());
      if (ticketId.trim()) params.set('ticket_id', ticketId.trim());
      
      const res = await fetch(`/api/admin/outbound?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Err_Node_Outbound');
      setItems(data.items || []);
    } catch (e: any) {
      setMsg(`Falla de Enlace: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [status, q, dealId, ticketId]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return items.filter((item) => {
      if (status && item.status !== status) return false;
      if (outcome && item.outcome !== outcome) return false;
      if (nq) {
        const content = `${item.to_email ?? ''} ${item.to_phone ?? ''} ${item.subject ?? ''} ${item.body ?? ''}`.toLowerCase();
        if (!content.includes(nq)) return false;
      }
      return true;
    });
  }, [items, status, outcome, q]);

  const stats = useMemo(() => {
    return {
      visible: filtered.length,
      pending: filtered.filter((r) => r.status === 'queued' || r.status === 'draft').length,
      sent: filtered.filter((r) => r.status === 'sent').length,
      failed: filtered.filter((r) => r.status === 'failed').length,
      replied: filtered.filter((r) => r.outcome === 'replied').length,
      paid: filtered.filter((r) => r.outcome === 'paid').length,
    };
  }, [filtered]);

  async function handleDispatch(id: string, channel: OutboundChannel) {
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outbound/${id}/send`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'send_now' }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispatch_Error');
      
      if (channel === 'whatsapp' && data.waLink) {
        window.open(data.waLink, '_blank', 'noopener,noreferrer');
      } else {
        setMsg(`Transmisión exitosa: Paquete enviado.`);
      }
      await load();
    } catch (e: any) {
      setMsg(`Falla en despacho: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function markAction(id: string, action: 'mark-sent' | 'mark-replied' | 'mark-lost') {
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outbound/${id}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error('State_Update_Failed');
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  const outboundSignals = [
    { label: 'Enfoque Actual', value: String(stats.visible), note: 'Mensajes en vista.' },
    { label: 'Cola de Salida', value: String(stats.pending), note: 'Pendientes por transmitir.' },
    { label: 'Revenue Linked', value: String(stats.paid), note: 'Cierres comerciales atribuidos.' },
    { label: 'Network Alert', value: String(stats.failed), note: 'Revisar nodo de salida.' },
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Radio className="h-4 w-4" /> Communication Lane: /outbound-vault-node
          </div>
          <h1 className="font-heading text-4xl md:text-7xl text-main tracking-tighter leading-none">
            Centro de <span className="text-brand-yellow italic font-light">Outbound</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Nodo de comunicaciones salientes de Knowing Cultures S.A.S. Supervisa el Autopilot de mensajería, gestiona la cola manual y audita la atribución de cierres.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      <AdminOperatorWorkbench
        eyebrow="Messaging Sovereignty"
        title="Escritorio de Comunicaciones"
        description="Asegura que el flujo de mensajes no se detenga. Procesa los pendientes ('Queued') y reatribuye los cierres si el sistema no los vinculó automáticamente."
        actions={[
          { href: '/admin/deals/board', label: 'Bandeja de Deals', tone: 'primary' },
          { href: '/admin/templates', label: 'Ver Plantillas' }
        ]}
        signals={outboundSignals}
      />

      {/* 03. LA BÓVEDA DE TRANSMISIONES */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative flex flex-col">
        
        {/* KPI DASHBOARD DINÁMICO */}
        <div className="p-8 grid gap-4 grid-cols-2 md:grid-cols-6 border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30">
          {[
            { l: 'Bóveda', v: stats.visible, c: 'text-brand-blue', i: Database },
            { l: 'En Cola', v: stats.pending, c: 'text-brand-yellow', i: Clock },
            { l: 'Enviados', v: stats.sent, c: 'text-main', i: Send },
            { l: 'Respondidos', v: stats.replied, c: 'text-green-600', i: MessageCircle },
            { l: 'Revenue', v: stats.paid, c: 'text-brand-blue font-bold', i: Zap },
            { l: 'Falla', v: stats.failed, c: 'text-red-600', i: AlertCircle }
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-brand-dark/5 dark:border-white/5 bg-surface p-5 shadow-soft transition-all hover:shadow-pop group">
              <div className="flex items-center justify-between mb-4">
                 <div className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-40">{s.l}</div>
                 <s.i className={`h-3.5 w-3.5 ${s.c} opacity-30 group-hover:opacity-100 transition-opacity`} />
              </div>
              <div className={`text-3xl font-heading tracking-tighter ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* INSTRUMENTACIÓN DE FILTROS */}
        <div className="p-8 border-b border-brand-dark/5 dark:border-white/5 bg-surface">
          <div className="flex flex-col xl:flex-row gap-8 xl:items-end justify-between">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-5 w-full xl:flex-1">
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Estado Nodo</label>
                <div className="relative">
                   <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40" />
                   <select className="w-full h-12 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-[10px] font-bold text-main outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="">TODOS LOS ESTADOS</option>
                    <option value="queued">PENDIENTES</option>
                    <option value="sent">ENVIADOS</option>
                    <option value="failed">FALLIDOS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Atribución Won</label>
                <div className="relative">
                   <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40" />
                   <select className="w-full h-12 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-[10px] font-bold text-main outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" value={outcome} onChange={(e) => setOutcome(e.target.value as any)}>
                    <option value="">CUALQUIER OUTCOME</option>
                    <option value="replied">RESPONDIDO</option>
                    <option value="paid">CONVERSIÓN (PAID)</option>
                    <option value="lost">PERDIDO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 md:col-span-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Contenido / Rastro</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
                  <input className="w-full h-12 pl-12 pr-4 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm text-main font-mono outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email, teléfono o fragmento del mensaje..." />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-surface-2 border border-brand-dark/5">
                  <div className={`h-2 w-2 rounded-full ${loading ? 'bg-brand-yellow animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                  <span className="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">{loading ? 'Syncing...' : 'Sync: Nominal'}</span>
               </div>
               <Button onClick={() => void load()} disabled={loading} className="h-12 rounded-full px-8 bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95">
                 <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar Nodo
               </Button>
            </div>
          </div>
        </div>

        {msg && (
          <div className={`mx-8 mt-6 rounded-[var(--radius-2xl)] border p-5 flex items-center gap-5 animate-in slide-in-from-top-2 shadow-sm font-bold ${msg.includes('Falla') ? 'border-red-500/20 bg-red-50 dark:bg-red-950/10 text-red-700 dark:text-red-400' : 'border-green-500/20 bg-green-50 dark:bg-green-950/10 text-green-700 dark:text-green-400'}`}>
            <ShieldCheck className="h-6 w-6 opacity-60" />
            <p className="text-sm">{msg}</p>
          </div>
        )}

        {/* TABLA DE TRANSMISIONES (LA BÓVEDA) */}
        <div className="overflow-x-auto custom-scrollbar px-2 pb-6">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Rastro / Destino</th>
                <th className="px-8 py-5">Protocolo & Transmisión</th>
                <th className="px-8 py-5 text-center">Status & Impacto</th>
                <th className="px-8 py-5 text-right">Mando Táctico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {loading && items.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-40 text-center animate-pulse text-[11px] font-bold uppercase tracking-[0.5em] text-muted bg-surface">Interrogando al núcleo outbound...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-40 text-center bg-surface">
                    <Activity className="mx-auto h-16 w-16 text-brand-blue opacity-10 mb-6" />
                    <p className="text-xl font-heading text-main tracking-tight opacity-30">Silencio en el Canal</p>
                    <p className="text-sm font-light text-muted mt-2 italic">No hay transmisiones registradas para estos criterios.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const dest = r.channel === 'email' ? r.to_email : r.to_phone;
                  const DestIcon = r.channel === 'email' ? Mail : Smartphone;
                  return (
                    <tr key={r.id} className={`group transition-colors hover:bg-surface-2/50 cursor-default bg-surface ${r.status === 'failed' ? 'bg-red-500/[0.02]' : ''}`}>
                      
                      {/* Identidad / Destino */}
                      <td className="px-8 py-8 align-top">
                        <div className="flex flex-col gap-4">
                           <div className="font-mono text-[10px] text-muted opacity-40 uppercase tracking-widest flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" /> {fmtDate(r.created_at)}
                           </div>
                           <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-inner ${r.channel === 'whatsapp' ? 'bg-green-500/10 text-green-600' : 'bg-brand-blue/10 text-brand-blue'}`}>
                                 <DestIcon className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                 <p className="font-bold text-main text-sm tracking-tight">{dest || 'ANONYMOUS_NODE'}</p>
                                 <div className="flex items-center gap-3">
                                    {r.deal_id && (
                                       <Link href={`/admin/deals/board?q=${r.deal_id}`} className="text-[9px] font-bold text-brand-blue hover:text-brand-yellow uppercase flex items-center gap-1 transition-colors">
                                          <Layout className="h-2.5 w-2.5" /> DEAL_{r.deal_id.slice(0,6)}
                                       </Link>
                                    )}
                                    {r.ticket_id && (
                                       <Link href={`/admin/support/tickets/${r.ticket_id}`} className="text-[9px] font-bold text-brand-yellow hover:text-brand-blue uppercase flex items-center gap-1 transition-colors">
                                          <AlertCircle className="h-2.5 w-2.5" /> TCK_{r.ticket_id.slice(0,6)}
                                       </Link>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                      </td>

                      {/* Cuerpo / Contenido */}
                      <td className="px-8 py-8 align-top max-w-[550px]">
                        <div className="flex flex-col gap-3">
                           <div className="flex items-center gap-3">
                              {r.provider === 'bot' && <span className="text-[9px] font-black uppercase tracking-tighter text-brand-blue flex items-center gap-1.5 bg-brand-blue/10 px-2 py-0.5 rounded shadow-sm border border-brand-blue/20"><Bot className="h-3 w-3"/> AUTOPILOT</span>}
                              {r.template_key && <span className="text-[9px] font-mono font-bold text-muted bg-surface-2 border border-brand-dark/10 rounded px-2 py-0.5 uppercase tracking-tighter">{r.template_key}::v{r.template_variant || 'A'}</span>}
                           </div>
                           {r.subject && <p className="font-bold text-main text-xs uppercase tracking-tight opacity-70 mb-1">{r.subject}</p>}
                           <div className="text-[12px] font-light leading-relaxed text-muted bg-surface-2/50 p-5 rounded-2xl border border-brand-dark/5 italic group-hover:text-main transition-colors relative overflow-hidden shadow-inner group/body">
                              <button onClick={() => { navigator.clipboard.writeText(r.body); setMsg('Contenido copiado al portapapeles ✅'); }} className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-surface border border-brand-dark/10 flex items-center justify-center text-muted hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all opacity-0 group-hover/body:opacity-100 shadow-sm active:scale-90">
                                 <Copy className="h-3.5 w-3.5"/>
                              </button>
                              &quot;{r.body}&quot;
                           </div>
                           {r.error && <div className="flex items-center gap-2 text-[10px] font-bold text-red-600 uppercase tracking-tighter mt-1"><AlertCircle className="h-3.5 w-3.5"/> LOG: {r.error}</div>}
                        </div>
                      </td>

                      {/* Status & Outcome */}
                      <td className="px-8 py-8 align-top text-center">
                        <div className="flex flex-col items-center gap-4">
                           {badgeStatus(r.status)}
                           <div className="flex flex-col items-center gap-2">
                              {badgeOutcome(r.outcome)}
                              {r.outcome === 'paid' && r.attributed_booking_id && (
                                <span className="text-[9px] font-mono font-bold text-brand-blue flex items-center gap-1.5 animate-pulse">
                                   <Zap className="h-3 w-3 fill-current" /> REVENUE_LINKED
                                </span>
                              )}
                           </div>
                        </div>
                      </td>

                      {/* Mando Táctico */}
                      <td className="px-8 py-8 align-top">
                        <div className="flex flex-col gap-3 max-w-[180px] ml-auto">
                           <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => void handleDispatch(r.id, r.channel)} className="h-10 rounded-xl bg-brand-dark text-brand-yellow text-[9px] font-bold uppercase tracking-widest hover:bg-brand-blue hover:text-white shadow-pop flex items-center justify-center gap-2 transition-all active:scale-95"><Send className="h-3.5 w-3.5" /> EMIT</button>
                              <button onClick={() => void markAction(r.id, 'mark-sent')} className="h-10 rounded-xl border border-brand-dark/10 bg-surface text-muted text-[9px] font-bold uppercase hover:bg-surface-2 transition-all shadow-sm">SENT</button>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => void markAction(r.id, 'mark-replied')} disabled={r.outcome === 'paid'} className="h-10 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 text-[9px] font-bold uppercase tracking-tighter border border-green-500/20 hover:bg-green-600 hover:text-white transition-all disabled:opacity-20 flex items-center justify-center gap-1.5"><MessageCircle className="h-3 w-3" /> REPLIED</button>
                              <button onClick={() => void markAction(r.id, 'mark-lost')} disabled={r.outcome === 'paid'} className="h-10 rounded-xl bg-red-500/10 text-red-700 dark:text-red-400 text-[9px] font-bold uppercase tracking-tighter border border-red-500/20 hover:bg-red-600 hover:text-white transition-all disabled:opacity-20 flex items-center justify-center gap-1.5"><XCircle className="h-3 w-3" /> LOST</button>
                           </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Communication Sovereignty Verified
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Bot className="h-4 w-4 opacity-50" /> Autopilot Node v3.1
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4 animate-pulse" /> Live Attribution Active
        </div>
      </footer>
    </div>
  );
}