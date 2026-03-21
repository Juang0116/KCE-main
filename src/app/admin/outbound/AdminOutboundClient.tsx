'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Mail, MessageCircle, Send, Search, RefreshCw, 
  Copy, CheckCircle2, Bot, AlertCircle, 
  ArrowRight, ExternalLink, Filter, 
  Clock, Zap, Check, X, Smartphone,
  ShieldCheck // ✅ Agrega esta línea aquí
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

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'sent') return `${base} border-emerald-500/20 bg-emerald-500/5 text-emerald-600`;
  if (s === 'queued') return `${base} border-amber-500/20 bg-amber-500/5 text-amber-600 animate-pulse`;
  if (s === 'failed') return `${base} border-rose-500/40 bg-rose-500/5 text-rose-600`;
  return `${base} border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text-muted)]`;
}

function badgeOutcome(outcome: string) {
  const o = (outcome || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border';
  if (o === 'paid') return `${base} bg-brand-blue text-white shadow-md border-brand-blue`;
  if (o === 'replied') return `${base} border-emerald-500/30 bg-emerald-500/5 text-emerald-700`;
  if (o === 'lost') return `${base} border-rose-500/30 bg-rose-500/5 text-rose-600`;
  return `${base} border-[color:var(--color-border)] bg-transparent text-[color:var(--color-text)]/50`;
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
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, q, dealId, ticketId]);

  useEffect(() => { load(); }, [load]);

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
        setMsg(`Transmisión exitosa: ${data.sent || 1} enviado(s).`);
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
    { label: 'Enfoque Actual', value: String(stats.visible), note: 'Mensajes filtrados en vista.' },
    { label: 'Cola de Salida', value: String(stats.pending), note: 'Transmisiones pendientes.' },
    { label: 'Conversión Won', value: String(stats.paid), note: 'Ventas atribuidas a mensajes.' },
    { label: 'Alerta Técnica', value: String(stats.failed), note: 'Revisar Resend/WABA node.' },
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Send className="h-3.5 w-3.5" /> Communication Lane: /outbound-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Centro de <span className="text-brand-yellow italic font-light">Outbound</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic">
            Nodo de comunicaciones salientes. Supervisa el Autopilot, gestiona la cola manual 
            y audita la atribución de cierres comerciales.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Messaging Sovereignty"
        title="Escritorio de Comunicaciones"
        description="Asegura que el flujo de mensajes no se detenga. Procesa los pendientes ('Queued') y reatribuye los cierres si el sistema no los detectó automáticamente."
        actions={[
          { href: '/admin/sales', label: 'Dashboard de Deals', tone: 'primary' },
          { href: '/admin/templates', label: 'Protocolos de Mensaje' }
        ]}
        signals={outboundSignals}
      />

      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        
        {/* KPI DASHBOARD DINÁMICO */}
        <div className="p-8 grid gap-4 grid-cols-2 md:grid-cols-6 border-b border-[color:var(--color-border)]">
          {[
            { l: 'Bóveda', v: stats.visible, c: 'text-brand-blue', i: Search },
            { l: 'Pendiente', v: stats.pending, c: 'text-amber-600', i: Clock },
            { l: 'Transmitido', v: stats.sent, c: 'text-[color:var(--color-text)]', i: Check },
            { l: 'Respuesta', v: stats.replied, c: 'text-emerald-600', i: MessageCircle },
            { l: 'Revenue', v: stats.paid, c: 'text-brand-blue font-bold', i: Zap },
            { l: 'Falla', v: stats.failed, c: 'text-rose-600', i: AlertCircle }
          ].map((s) => (
            <div key={s.l} className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-2">
                 <div className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">{s.l}</div>
                 <s.i className={`h-3 w-3 ${s.c} opacity-30 group-hover:opacity-100 transition-opacity`} />
              </div>
              <div className={`text-2xl font-heading ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* INSTRUMENTACIÓN DE FILTROS */}
        <div className="p-8 border-b border-[color:var(--color-border)]">
          <div className="flex flex-col xl:flex-row gap-6 xl:items-end justify-between">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 w-full xl:w-4/5">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Estado</label>
                <select className="w-full h-12 px-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[10px] font-bold text-brand-blue outline-none appearance-none cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="">TODOS</option>
                  <option value="queued">PENDIENTES</option>
                  <option value="sent">ENVIADOS</option>
                  <option value="failed">FALLIDOS</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Atribución</label>
                <select className="w-full h-12 px-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[10px] font-bold text-brand-blue outline-none appearance-none cursor-pointer" value={outcome} onChange={(e) => setOutcome(e.target.value as any)}>
                  <option value="">CUALQUIER OUTCOME</option>
                  <option value="replied">RESPONDIDO</option>
                  <option value="paid">CONVERSIÓN (PAID)</option>
                  <option value="lost">PERDIDO</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Filtrar por Contenido</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <input className="w-full h-12 pl-12 pr-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[11px] font-light outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email, teléfono o rastro del mensaje..." />
                </div>
              </div>

            </div>

            <Button onClick={load} disabled={loading} className="h-12 rounded-xl px-8 bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Nodo
            </Button>
          </div>
        </div>

        {msg && (
          <div className={`mx-8 mt-6 rounded-2xl border p-4 flex items-center gap-4 animate-in zoom-in-95 ${msg.includes('Falla') ? 'border-rose-500/20 bg-rose-500/5 text-rose-700' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700'}`}>
            <ShieldCheck className="h-5 w-5 opacity-40" />
            <p className="text-sm font-medium">{msg}</p>
          </div>
        )}

        {/* TABLA DE TRANSMISIONES */}
        <div className="overflow-x-auto px-6 py-8">
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden shadow-sm">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-[color:var(--color-surface-2)] border-b border-[color:var(--color-border)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                  <th className="px-8 py-6">Rastro Temporal / Destino</th>
                  <th className="px-8 py-6">Protocolo & Cuerpo</th>
                  <th className="px-8 py-6 text-center">Status & Atribución</th>
                  <th className="px-8 py-6 text-right">Mando Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {loading && items.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-24 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-brand-blue/20">Interrogando la base outbound...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-32 text-center text-[color:var(--color-text)]/50 italic">Sin señales en esta ventana.</td></tr>
                ) : (
                  filtered.map((r) => {
                    const dest = r.channel === 'email' ? r.to_email : r.to_phone;
                    const DestIcon = r.channel === 'email' ? Mail : Smartphone;
                    return (
                      <tr key={r.id} className={`group transition-all hover:bg-brand-blue/[0.01] ${r.status === 'failed' ? 'bg-rose-500/[0.02]' : ''}`}>
                        <td className="px-8 py-6 align-top">
                          <div className="font-mono text-[9px] text-[color:var(--color-text)]/30 mb-2 uppercase tracking-widest flex items-center gap-2">
                             <Clock className="h-3 w-3" /> {fmtDate(r.created_at)}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${r.channel === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-brand-blue/10 text-brand-blue'}`}>
                               <DestIcon className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                               <p className="font-bold text-[color:var(--color-text)] text-xs">{dest || 'ANÓNIMO'}</p>
                               <div className="flex gap-2">
                                 {r.deal_id && <Link href={`/admin/deals?q=${r.deal_id}`} className="text-[8px] font-bold text-brand-blue hover:underline uppercase">DEAL_{r.deal_id.slice(0,4)}</Link>}
                                 {r.ticket_id && <Link href={`/admin/tickets/${r.ticket_id}`} className="text-[8px] font-bold text-amber-600 hover:underline uppercase">TCK_{r.ticket_id.slice(0,4)}</Link>}
                               </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-6 align-top max-w-[450px]">
                          <div className="mb-3 flex items-center gap-2">
                            {r.provider === 'bot' && <span className="text-[9px] font-bold uppercase tracking-widest text-brand-blue flex items-center gap-1.5 bg-brand-blue/5 px-2 py-1 rounded-md"><Bot className="h-3 w-3"/> Autopilot_Active</span>}
                            {r.template_key && <span className="text-[8px] font-mono font-bold text-[color:var(--color-text)]/30 bg-black/5 rounded-md px-2 py-1 uppercase">{r.template_key}::v{r.template_variant || 'A'}</span>}
                          </div>
                          {r.subject && <p className="font-bold text-[color:var(--color-text)] mb-2 text-xs uppercase tracking-tight">{r.subject}</p>}
                          <div className="text-[11px] font-light leading-relaxed text-[color:var(--color-text)]/70 bg-[color:var(--color-surface-2)] p-4 rounded-2xl border border-[color:var(--color-border)] italic group-hover:text-[color:var(--color-text)] transition-colors relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { navigator.clipboard.writeText(r.body); setMsg('Copiado ✅'); }} className="h-6 w-6 rounded-md bg-[color:var(--color-surface)] border border-brand-blue/10 flex items-center justify-center text-brand-blue hover:bg-brand-blue hover:text-white"><Copy className="h-3 w-3"/></button>
                             </div>
                             {r.body}
                          </div>
                          {r.error && <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-rose-600 uppercase tracking-tighter"><AlertCircle className="h-3.5 w-3.5"/> {r.error}</div>}
                        </td>

                        <td className="px-8 py-6 align-top text-center space-y-4">
                          <div>{badgeStatus(r.status)}</div>
                          <div className="flex flex-col items-center gap-1">
                            {badgeOutcome(r.outcome)}
                            {r.outcome === 'paid' && r.attributed_booking_id && (
                              <span className="text-[8px] font-mono font-bold text-brand-blue flex items-center gap-1"><Zap className="h-2.5 w-2.5" /> REVENUE_LINKED</span>
                            )}
                          </div>
                        </td>

                        <td className="px-8 py-6 align-top">
                          <div className="flex flex-col gap-2 max-w-[160px] ml-auto">
                            <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => void handleDispatch(r.id, r.channel)} className="h-9 rounded-xl bg-brand-blue text-white text-[9px] font-bold uppercase tracking-widest hover:bg-brand-blue/90 shadow-sm flex items-center justify-center gap-1.5"><Send className="h-3 w-3" /> Emit</button>
                               <button onClick={() => void markAction(r.id, 'mark-sent')} className="h-9 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] text-[9px] font-bold uppercase hover:bg-black/5">Sent</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => void markAction(r.id, 'mark-replied')} disabled={r.outcome === 'paid'} className="h-9 rounded-xl bg-emerald-500/10 text-emerald-700 text-[9px] font-bold uppercase tracking-tighter border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30">Replied</button>
                               <button onClick={() => void markAction(r.id, 'mark-lost')} disabled={r.outcome === 'paid'} className="h-9 rounded-xl bg-rose-500/10 text-rose-700 text-[9px] font-bold uppercase tracking-tighter border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30">Lost</button>
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
        </div>
      </section>

      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Communication Sovereignty
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Bot className="h-3.5 w-3.5" /> Autopilot Node v3.1
        </div>
      </footer>
    </div>
  );
}