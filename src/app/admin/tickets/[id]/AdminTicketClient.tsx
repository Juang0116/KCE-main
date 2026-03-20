'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch.client';
import { LifeBuoy, Clock, Send, MessageSquare, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw, Zap } from 'lucide-react';

type MessageRow = {
  id: string;
  role: 'user' | 'agent' | 'system' | string;
  content: string;
  created_at: string;
};

type TicketResp = {
  ticket?: {
    id: string;
    subject: string | null;
    status: string | null;
    priority: string | null;
    channel: string | null;
    created_at: string | null;
    updated_at: string | null;
    conversation_id?: string | null;
  };
  conversation?: {
    id: string;
    channel: string | null;
    created_at: string | null;
  };
  messages?: MessageRow[];
};

const SLA_WARN_HOURS = 24;
const SLA_BREACH_HOURS = 48;

function ageHours(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60);
}

function slaLabel(status: string | null | undefined, createdAt: string | null | undefined) {
  const st = String(status || '').toLowerCase();
  if (st === 'resolved') return { label: 'RESUELTO', tone: 'ok' as const };
  const h = ageHours(createdAt);
  if (h == null) return { label: '—', tone: 'neutral' as const };
  if (h >= SLA_BREACH_HOURS) return { label: 'BREACH', tone: 'bad' as const };
  if (h >= SLA_WARN_HOURS) return { label: 'AT RISK', tone: 'warn' as const };
  return { label: 'OK', tone: 'ok' as const };
}

function badgeValue(val: string) {
  const v = val.toLowerCase();
  if (v === 'open' || v === 'urgent' || v === 'high') return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
  if (v === 'pending' || v === 'normal') return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
  if (v === 'in_progress') return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
  if (v === 'resolved') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
  return 'bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/70 border-[color:var(--color-border)]';
}

const MACROS: { key: string; title: string; body: string }[] = [
  {
    key: 'ask_details',
    title: 'Pedir detalles (rápido)',
    body: 'Hola 👋\n\n¡Gracias por escribirnos! Para ayudarte mejor, ¿nos confirmas por favor?:\n- Fecha deseada\n- Número de personas\n- Ciudad / punto de encuentro (o hotel)\n\nCon eso te confirmamos disponibilidad y el siguiente paso.\n\n— Equipo KCE',
  },
  {
    key: 'confirm_received',
    title: 'Confirmar recibido',
    body: '¡Listo! Recibimos tu mensaje ✅\n\nEstamos revisando y te respondemos en breve.\n\n— Equipo KCE',
  },
  {
    key: 'send_payment_link',
    title: 'Enviar link de pago',
    body: 'Te comparto el enlace de pago seguro (Stripe).\n\nCuando finalices, te llega confirmación + factura PDF al correo.\n\n¿Quieres que lo deje para hoy o prefieres otra fecha?\n\n— Equipo KCE',
  },
  {
    key: 'close_resolved',
    title: 'Cerrar (resuelto)',
    body: 'Perfecto ✅\n\nDamos tu caso por resuelto. Si necesitas algo más, responde este mensaje y con gusto te ayudamos.\n\n— Equipo KCE',
  },
];

export function AdminTicketClient({ id }: { id: string }) {
  const [data, setData] = useState<TicketResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [macroKey, setMacroKey] = useState<string>(MACROS[0]?.key || '');

  async function load() {
    setLoading(true); setErr(null); setOkMsg(null);
    try {
      const res = await adminFetch(`/api/admin/tickets/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setData((j || {}) as TicketResp);
    } catch (e: any) {
      setErr(e?.message || String(e)); setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true); setErr(null); setOkMsg(null);
    try {
      const res = await adminFetch(`/api/admin/tickets/${encodeURIComponent(id)}/reply`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: reply.trim() }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setReply(''); setOkMsg('Respuesta enviada correctamente ✅');
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setSending(false);
      setTimeout(() => setOkMsg(null), 3000);
    }
  }

  function applyMacro() {
    const m = MACROS.find((x) => x.key === macroKey);
    if (!m) return;
    setReply((prev) => {
      const base = String(prev || '').trim();
      return base ? `${base}\n\n${m.body}` : m.body;
    });
  }

  useEffect(() => { load().catch(() => {}); }, [id]);

  const sla = slaLabel(data?.ticket?.status, data?.ticket?.created_at);
  const toneClass = sla.tone === 'bad' ? 'bg-rose-500/10 text-rose-700 border-rose-500/20' : sla.tone === 'warn' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : sla.tone === 'ok' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/70 border-[color:var(--color-border)]';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-20">
      
      {/* Breadcrumbs & Header */}
      <div>
        <Link href="/admin/tickets" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 hover:text-brand-blue transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Volver a Bandeja de Soporte
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LifeBuoy className="h-6 w-6 text-brand-blue" />
              <h1 className="font-heading text-2xl md:text-3xl text-[color:var(--color-text)] leading-tight">
                {data?.ticket?.subject || 'Resolución de Ticket'}
              </h1>
            </div>
            <div className="text-xs text-[color:var(--color-text)]/50 font-mono flex items-center gap-2">
              Ticket ID: {id.slice(0,8)} 
              {data?.ticket?.conversation_id && <><span className="text-[color:var(--color-border)]">|</span> Conv: <Link href={`/admin/conversations/${data.ticket.conversation_id}`} className="text-brand-blue hover:underline">{data.ticket.conversation_id.slice(0,8)}</Link></>}
            </div>
          </div>
          <button onClick={load} disabled={loading} className="shrink-0 flex items-center justify-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)] disabled:opacity-50">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>
      </div>

      {err && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}
      {okMsg && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800">{okMsg}</div>}

      {/* Tarjeta de Metadatos */}
      <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 mb-1.5">Estado</div>
            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${badgeValue(data?.ticket?.status || '')}`}>{data?.ticket?.status || '—'}</span>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 mb-1.5">Prioridad</div>
            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${badgeValue(data?.ticket?.priority || '')}`}>{data?.ticket?.priority || '—'}</span>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 mb-1.5">Canal</div>
            <div className="text-sm font-medium text-[color:var(--color-text)] capitalize">{data?.ticket?.channel || '—'}</div>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 mb-1.5">Actualizado</div>
            <div className="text-sm font-medium text-[color:var(--color-text)]">
              {data?.ticket?.updated_at ? new Date(data.ticket.updated_at).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 mb-1.5">SLA Check</div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${toneClass}`}>
                <Clock className="h-3 w-3" /> {sla.label}
              </span>
              <span className="text-[10px] text-[color:var(--color-text)]/40 font-mono">
                {ageHours(data?.ticket?.created_at) != null ? `${Math.round(ageHours(data?.ticket?.created_at)! * 10) / 10}h` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        
        {/* Historial de Mensajes (Chat UI) */}
        <div className="lg:col-span-2 rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm flex flex-col h-[700px] overflow-hidden">
          <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-6 py-4 flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-brand-blue" />
            <h3 className="font-heading text-lg text-[color:var(--color-text)]">Historial de Conversación</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/5 dark:bg-white/5 custom-scrollbar">
            {(data?.messages || []).length === 0 && !loading ? (
              <div className="h-full flex flex-col items-center justify-center text-[color:var(--color-text)]/30">
                <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No hay mensajes registrados en este ticket.</p>
              </div>
            ) : null}

            {(data?.messages || []).map((m) => {
              const isAgent = m.role === 'agent' || m.role === 'system';
              return (
                <div key={m.id} className={`flex flex-col w-full max-w-[85%] ${isAgent ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <div className={`mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isAgent ? 'text-brand-blue' : 'text-[color:var(--color-text)]/50'}`}>
                    {isAgent ? 'Agente KCE / Sistema' : 'Cliente'}
                    <span className="font-mono font-normal opacity-50 lowercase">{m.created_at ? new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <div className={`px-5 py-4 text-sm font-light leading-relaxed whitespace-pre-wrap shadow-sm ${isAgent ? 'rounded-3xl rounded-tr-sm bg-brand-blue text-white' : 'rounded-3xl rounded-tl-sm border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]'}`}>
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Respuesta Rápida */}
        <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm sticky top-6">
          <div className="flex items-center gap-3 mb-6">
            <Send className="h-5 w-5 text-brand-blue" />
            <h3 className="font-heading text-lg text-[color:var(--color-text)]">Redactar Respuesta</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 flex items-center gap-1 mb-2">
                <Zap className="h-3 w-3" /> Macros Rápidos
              </label>
              <div className="flex gap-2">
                <select className="flex-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-xs outline-none focus:border-brand-blue appearance-none cursor-pointer" value={macroKey} onChange={(e) => setMacroKey(e.target.value)}>
                  {MACROS.map((m) => <option key={m.key} value={m.key}>{m.title}</option>)}
                </select>
                <button onClick={applyMacro} disabled={sending} className="rounded-xl bg-brand-dark px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow hover:scale-105 transition-all shadow-sm disabled:opacity-50">
                  Insertar
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 block mb-2">Mensaje (Como Agente)</label>
              <textarea
                className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-light leading-relaxed outline-none focus:border-brand-blue min-h-[250px] resize-none"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Escribe tu respuesta al cliente aquí..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setReply('')} disabled={sending || !reply} className="rounded-xl border border-[color:var(--color-border)] bg-transparent px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/60 hover:bg-[color:var(--color-surface-2)] transition-colors disabled:opacity-30">
                Limpiar
              </button>
              <button onClick={sendReply} disabled={sending || !reply.trim()} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-brand-blue/90 shadow-md transition-all disabled:opacity-50">
                {sending ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>} 
                {sending ? 'Enviando...' : 'Enviar Respuesta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}