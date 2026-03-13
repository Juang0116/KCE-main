/* src/app/admin/tickets/[id]/AdminTicketClient.tsx */
'use client';

import { useEffect, useState } from 'react';

import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';

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

const MACROS: { key: string; title: string; body: string }[] = [
  {
    key: 'ask_details',
    title: 'Pedir detalles (rápido)',
    body:
      'Hola 👋\n\n¡Gracias por escribirnos! Para ayudarte mejor, ¿nos confirmas por favor?:\n- Fecha deseada\n- Número de personas\n- Ciudad / punto de encuentro (o hotel)\n\nCon eso te confirmamos disponibilidad y el siguiente paso.\n\n— Equipo KCE',
  },
  {
    key: 'confirm_received',
    title: 'Confirmar recibido',
    body:
      '¡Listo! Recibimos tu mensaje ✅\n\nEstamos revisando y te respondemos en breve.\n\n— Equipo KCE',
  },
  {
    key: 'send_payment_link',
    title: 'Enviar link de pago',
    body:
      'Te comparto el enlace de pago seguro (Stripe).\n\nCuando finalices, te llega confirmación + factura PDF al correo.\n\n¿Quieres que lo deje para hoy o prefieres otra fecha?\n\n— Equipo KCE',
  },
  {
    key: 'close_resolved',
    title: 'Cerrar (resuelto)',
    body:
      'Perfecto ✅\n\nDamos tu caso por resuelto. Si necesitas algo más, responde este mensaje y con gusto te ayudamos.\n\n— Equipo KCE',
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
    setLoading(true);
    setErr(null);
    setOkMsg(null);

    try {
      const res = await adminFetch(`/api/admin/tickets/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setData((j || {}) as TicketResp);
    } catch (e: any) {
      setErr(e?.message || String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    setErr(null);
    setOkMsg(null);

    try {
      const res = await adminFetch(`/api/admin/tickets/${encodeURIComponent(id)}/reply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: reply.trim() }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setReply('');
      setOkMsg('Enviado ✅');
      await load();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setSending(false);
      setTimeout(() => setOkMsg(null), 1500);
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

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <section className="space-y-4">
      {err ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {err}
        </div>
      ) : null}

      {okMsg ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-100">
          {okMsg}
        </div>
      ) : null}

      <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-text)]">
              {data?.ticket?.subject || 'Ticket'}
            </div>
            <div className="mt-1 text-xs text-[color:var(--color-text)]/60">
              ID: <span className="font-mono">{id}</span>
              {data?.ticket?.conversation_id ? (
                <>
                  {' '}
                  • conversation:{' '}
                  <span className="font-mono">{data.ticket.conversation_id}</span>
                </>
              ) : null}
            </div>
          </div>

          <Button onClick={load} disabled={loading} variant="secondary">
            {loading ? 'Cargando…' : 'Refrescar'}
          </Button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-5 text-sm">
          <div className="rounded-xl border border-black/10 bg-black/5 p-3">
            <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">Estado</div>
            <div className="mt-1 font-medium">{data?.ticket?.status || '—'}</div>
          </div>
          <div className="rounded-xl border border-black/10 bg-black/5 p-3">
            <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">Prioridad</div>
            <div className="mt-1 font-medium">{data?.ticket?.priority || '—'}</div>
          </div>
          <div className="rounded-xl border border-black/10 bg-black/5 p-3">
            <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">Canal</div>
            <div className="mt-1 font-medium">{data?.ticket?.channel || '—'}</div>
          </div>
          <div className="rounded-xl border border-black/10 bg-black/5 p-3">
            <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">Actualizado</div>
            <div className="mt-1 font-medium">
              {data?.ticket?.updated_at ? new Date(data.ticket.updated_at).toLocaleString() : '—'}
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-black/5 p-3">
            <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">SLA</div>
            {(() => {
              const s = slaLabel(data?.ticket?.status || null, data?.ticket?.created_at || null);
              const tone =
                s.tone === 'bad'
                  ? 'bg-red-500/15 text-red-700'
                  : s.tone === 'warn'
                    ? 'bg-amber-500/15 text-amber-800'
                    : s.tone === 'ok'
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : 'bg-black/10 text-[color:var(--color-text)]/80';
              const h = ageHours(data?.ticket?.created_at || null);
              return (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{s.label}</span>
                  <span className="text-xs text-[color:var(--color-text)]/60">Edad: {h == null ? '—' : `${Math.round(h * 10) / 10}h`}</span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
        <div className="text-sm font-semibold">Conversación</div>

        <div className="mt-3 space-y-2">
          {(data?.messages || []).length === 0 ? (
            <div className="text-sm text-[color:var(--color-text)]/60">Sin mensajes.</div>
          ) : null}

          {(data?.messages || []).map((m) => (
            <div key={m.id} className="rounded-xl border border-black/10 bg-black/5 p-3">
              <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--color-text)]/60">
                <span className="font-mono">{m.role}</span>
                <span>{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</span>
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--color-text)]">{m.content}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-black/10 p-3">
          <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">Responder (role=agent)</div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-lg border border-black/10 bg-transparent px-3 text-sm"
              value={macroKey}
              onChange={(e) => setMacroKey(e.target.value)}
            >
              {MACROS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.title}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={applyMacro} disabled={sending}>
              Insertar macro
            </Button>
          </div>

          <textarea
            className="mt-2 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm min-h-[120px]"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escribe la respuesta…"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? 'Enviando…' : 'Enviar'}
            </Button>
            <Button variant="secondary" onClick={() => setReply('')} disabled={sending || !reply}>
              Limpiar
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
