'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Mail, MessageCircle, Send, Search, RefreshCw, Copy, CheckCircle2, Bot, AlertCircle } from 'lucide-react';
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

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (s === 'sent') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (s === 'queued') return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
  if (s === 'failed') return `${base} border-rose-500/20 bg-rose-500/10 text-rose-700`;
  return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
}

function badgeOutcome(outcome: string) {
  const o = (outcome || '').toLowerCase();
  const base = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (o === 'paid') return `${base} bg-brand-blue text-white shadow-sm border-brand-blue`;
  if (o === 'replied') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (o === 'lost') return `${base} border-rose-500/20 bg-rose-500/10 text-rose-700`;
  return `${base} border-[var(--color-border)] bg-transparent text-[var(--color-text)]/40`;
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

  const filtered = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return items.filter((item) => {
      if (status && item.status !== status) return false;
      if (outcome && item.outcome !== outcome) return false;
      if (dealId.trim() && item.deal_id !== dealId.trim()) return false;
      if (ticketId.trim() && item.ticket_id !== ticketId.trim()) return false;
      if (nq) {
        const hay = `${item.to_email ?? ''} ${item.to_phone ?? ''} ${item.subject ?? ''} ${item.body ?? ''}`.toLowerCase();
        if (!hay.includes(nq)) return false;
      }
      return true;
    });
  }, [items, status, outcome, q, dealId, ticketId]);

  const stats = useMemo(() => {
    const visible = filtered.length;
    const pending = filtered.filter((r) => r.status === 'queued' || r.status === 'draft').length;
    const sent = filtered.filter((r) => r.status === 'sent').length;
    const failed = filtered.filter((r) => r.status === 'failed').length;
    const replied = filtered.filter((r) => r.outcome === 'replied').length;
    const paid = filtered.filter((r) => r.outcome === 'paid').length;
    return { visible, pending, sent, failed, replied, paid };
  }, [filtered]);

  async function load() {
    setMsg('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (q.trim()) params.set('q', q.trim());
      if (dealId.trim()) params.set('deal_id', dealId.trim());
      if (ticketId.trim()) params.set('ticket_id', ticketId.trim());
      const data = await api<{ items: OutboundRow[] }>(`/api/admin/outbound?${params.toString()}`);
      setItems(data.items || []);
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo cargar outbound.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openWhatsApp(id: string) {
    setMsg('');
    try {
      const data = await api<{ waLink: string }>(`/api/admin/outbound/${id}/send`, { method: 'POST', body: JSON.stringify({ mode: 'send_now' }) });
      if (data.waLink) window.open(data.waLink, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo abrir WhatsApp.'));
    }
  }

  async function sendEmail(id: string) {
    setMsg('');
    setLoading(true);
    try {
      const data = await api<{ ok: boolean; sent: number; failed: number }>(`/api/admin/outbound/${id}/send`, { method: 'POST', body: JSON.stringify({ mode: 'send_now' }) });
      setMsg(`Email procesado — Sent: ${data.sent} | Failed: ${data.failed}`);
      await load();
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo enviar email.'));
    } finally {
      setLoading(false);
    }
  }

  async function markAction(id: string, action: 'mark-sent' | 'mark-replied' | 'mark-lost') {
    setMsg('');
    setLoading(true);
    try {
      await api(`/api/admin/outbound/${id}/${action}`, { method: 'POST', body: JSON.stringify({}) });
      await load();
    } catch (e: any) {
      setMsg(String(e?.message || `Error en ${action}.`));
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    try {
      navigator.clipboard.writeText(text);
      setMsg('Mensaje copiado al portapapeles ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('No se pudo copiar.');
    }
  }

  const outboundSignals = [
    { label: 'Visibles', value: String(stats.visible), note: 'Mensajes en la vista actual.' },
    { label: 'En Cola', value: String(stats.pending), note: 'Listos para ser enviados.' },
    { label: 'Conversión', value: String(stats.paid), note: 'Mensajes atribuidos a ventas reales.' },
    { label: 'Alertas', value: String(stats.failed), note: 'Envíos fallidos (Revisar Resend/WABA).' },
  ];

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Centro de Outbound</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Control de envíos salientes (Emails y WhatsApp), seguimiento y atribución.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Communication Hub"
        title="Supervisa tus comunicaciones"
        description="Aquí está el registro de todo lo que el Autopilot y tú envían a los clientes. Asegúrate de procesar la cola pendiente y revisar los mensajes fallidos."
        actions={[
          { href: '/admin/sales', label: 'Ver Deals', tone: 'primary' },
          { href: '/admin/templates', label: 'Editar Plantillas' }
        ]}
        signals={outboundSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* KPI Mini-cards */}
        <div className="mb-8 grid gap-3 grid-cols-2 md:grid-cols-6">
          {[
            { label: 'Visibles', val: stats.visible, color: 'text-brand-blue' },
            { label: 'Pendientes', val: stats.pending, color: 'text-amber-600' },
            { label: 'Enviados', val: stats.sent, color: 'text-[var(--color-text)]' },
            { label: 'Respuestas', val: stats.replied, color: 'text-emerald-600' },
            { label: 'Atribuidos', val: stats.paid, color: 'text-brand-blue' },
            { label: 'Fallidos', val: stats.failed, color: 'text-rose-600' }
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-center transition-transform hover:scale-[1.02]">
              <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">{s.label}</div>
              <div className={`mt-1 font-heading text-2xl ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Quick Filters */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-6">
          <button onClick={() => { setStatus(''); setOutcome(''); }} className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${!status && !outcome ? 'bg-brand-dark text-brand-yellow shadow-sm' : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]/60 hover:bg-[var(--color-surface)]'}`}>Todos</button>
          <button onClick={() => { setStatus('queued'); setOutcome(''); }} className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${status === 'queued' ? 'bg-amber-500 text-white shadow-sm' : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]/60 hover:bg-[var(--color-surface)]'}`}>Trabajar Pendientes</button>
          <button onClick={() => { setStatus('failed'); setOutcome(''); }} className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${status === 'failed' ? 'bg-rose-600 text-white shadow-sm' : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]/60 hover:bg-[var(--color-surface)]'}`}>Corregir Fallidos</button>
          <button onClick={() => { setStatus(''); setOutcome('replied'); }} className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${outcome === 'replied' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]/60 hover:bg-[var(--color-surface)]'}`}>Ver Respuestas</button>
        </div>

        {/* Detailed Filters */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between mb-8">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 w-full xl:w-4/5">
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Estado (Status)</div>
              <select className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none appearance-none cursor-pointer focus:border-brand-blue transition-colors" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="">Todos</option><option value="queued">En Cola (Queued)</option><option value="sent">Enviados (Sent)</option><option value="failed">Fallidos (Failed)</option><option value="draft">Borrador (Draft)</option><option value="canceled">Cancelados (Canceled)</option>
              </select>
            </label>
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Resultado (Outcome)</div>
              <select className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none appearance-none cursor-pointer focus:border-brand-blue transition-colors" value={outcome} onChange={(e) => setOutcome(e.target.value as any)}>
                <option value="">Todos</option><option value="none">Sin Respuesta</option><option value="replied">Respondido</option><option value="paid">Comprado (Paid)</option><option value="lost">Perdido (Lost)</option>
              </select>
            </label>
            <label className="text-sm md:col-span-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Buscar Texto</div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
                <input className="h-12 w-full pl-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue transition-colors" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email, teléfono o contenido del mensaje..." />
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={load} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Cargando...' : 'Sync'}
            </button>
          </div>
        </div>

        {msg && (
          <div className={`mb-6 rounded-2xl border p-4 text-sm font-medium flex items-center gap-2 ${msg.includes('error') || msg.includes('No se pudo') ? 'border-rose-500/20 bg-rose-500/10 text-rose-800' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-800'}`}>
            {msg.includes('error') || msg.includes('No se pudo') ? <AlertCircle className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>} {msg}
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Fecha & Destino</th>
                <th className="px-6 py-5">Mensaje & Atribución</th>
                <th className="px-6 py-5 text-center">Outcome</th>
                <th className="px-6 py-5 text-right">Acciones Manuales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading && items.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-sm font-medium text-[var(--color-text)]/40">Cargando bandeja de salida...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    <div className="font-medium text-[var(--color-text)]/40">Bandeja limpia para estos filtros.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const dest = r.channel === 'email' ? (r.to_email || '—') : (r.to_phone || '—');
                  const Icon = r.channel === 'email' ? Mail : MessageCircle;
                  return (
                    <tr key={r.id} className={`transition-colors hover:bg-[var(--color-surface-2)]/50 ${r.status === 'failed' ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''}`}>
                      <td className="px-6 py-5 align-top">
                        <div className="font-mono text-[10px] text-[var(--color-text)]/50 mb-2 uppercase tracking-widest">{fmtDate(r.created_at)}</div>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${r.channel === 'whatsapp' ? 'text-emerald-500' : 'text-brand-blue'}`} />
                          <span className="font-semibold text-[var(--color-text)]">{dest}</span>
                        </div>
                        <div className="mt-3 flex flex-col gap-1.5">
                          {r.deal_id && <Link href={`/admin/deals/${r.deal_id}`} className="w-max inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md border border-brand-blue/20 hover:bg-brand-blue hover:text-white transition-colors">DEAL: {r.deal_id.slice(0,8)}</Link>}
                          {r.ticket_id && <Link href={`/admin/tickets/${r.ticket_id}`} className="w-max inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-colors">TICKET: {r.ticket_id.slice(0,8)}</Link>}
                        </div>
                      </td>

                      <td className="px-6 py-5 align-top max-w-[400px]">
                        <div className="mb-3 flex items-center gap-2">
                          {badgeStatus(r.status)}
                          {r.provider === 'bot' && <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-brand-blue"><Bot className="h-3 w-3"/> Autopilot</span>}
                          {r.template_key && <span className="text-[9px] font-mono font-bold text-[var(--color-text)]/40 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md px-2 py-0.5">{r.template_key} (Var {r.template_variant || 'A'})</span>}
                        </div>
                        {r.subject && <div className="font-semibold text-[var(--color-text)] mb-2 text-sm">{r.subject}</div>}
                        <div className="text-xs font-light leading-relaxed text-[var(--color-text)]/70 line-clamp-3 bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-border)] shadow-inner">
                          {r.body}
                        </div>
                        {r.error && <div className="mt-3 text-xs font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 shadow-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0"/> {r.error}</div>}
                      </td>

                      <td className="px-6 py-5 align-top text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div>{badgeOutcome(r.outcome)}</div>
                          {r.outcome === 'replied' && r.replied_at && <div className="text-[9px] font-mono text-[var(--color-text)]/50 mt-1 uppercase tracking-widest">{fmtDate(r.replied_at)}</div>}
                          {r.outcome === 'paid' && r.attributed_booking_id && <div className="text-[10px] font-mono font-bold text-brand-blue mt-1 bg-brand-blue/5 px-2 py-0.5 rounded border border-brand-blue/20">bk_{r.attributed_booking_id.slice(0,4)}</div>}
                        </div>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-wrap justify-end gap-2 max-w-[180px] ml-auto">
                          
                          {/* Botones Primarios de Envío */}
                          {r.channel === 'whatsapp' ? (
                            <>
                              <button onClick={() => void openWhatsApp(r.id)} className="flex flex-1 min-w-[70px] h-9 items-center justify-center rounded-xl bg-emerald-500 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 shadow-sm">
                                WA Link
                              </button>
                              <button onClick={() => void markAction(r.id, 'mark-sent')} className="flex flex-1 min-w-[70px] h-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)]">
                                Sent
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => void sendEmail(r.id)} disabled={loading} className="flex flex-1 min-w-[70px] h-9 items-center justify-center gap-1 rounded-xl bg-brand-blue text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 disabled:opacity-50 shadow-sm">
                                <Send className="h-3 w-3"/> Enviar
                              </button>
                              <button onClick={() => void markAction(r.id, 'mark-sent')} className="flex flex-1 min-w-[70px] h-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)]">
                                Sent
                              </button>
                            </>
                          )}

                          <div className="w-full h-px bg-[var(--color-border)] my-1"></div>

                          {/* Botones de Atribución */}
                          <button onClick={() => void markAction(r.id, 'mark-replied')} disabled={loading || r.outcome === 'paid'} className="flex flex-1 min-w-[70px] h-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-[9px] font-bold uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-30">
                            Reply
                          </button>
                          <button onClick={() => void markAction(r.id, 'mark-lost')} disabled={loading || r.outcome === 'paid'} className="flex flex-1 min-w-[70px] h-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-50 text-[9px] font-bold uppercase tracking-widest text-rose-600 transition hover:bg-rose-100 disabled:opacity-30">
                            Lost
                          </button>

                          {/* Utilidades */}
                          <button onClick={() => copy(r.body || '')} className="mt-1 w-full flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-surface-2)] text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 transition hover:bg-[var(--color-border)]" title="Copiar Mensaje">
                            <Copy className="h-3 w-3" /> Copiar Texto
                          </button>
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
    </div>
  );
}