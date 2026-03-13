// src/app/admin/ai/AdminAiLabClient.tsx
'use client';

import * as React from 'react';

import { ChatMarkdown } from '@/components/ChatMarkdown';
import { AssistantMessageBlocks } from '@/features/ai/AssistantMessageBlocks';
import { Button } from '@/components/ui/Button';

type Msg = { role: 'user' | 'assistant'; content: string };
type ResponseMeta = {
  provider?: string | undefined;
  model?: string | undefined;
  conversationId?: string | undefined;
  ticketId?: string | undefined;
};

const PRESETS = [
  {
    label: 'Tours culturales',
    text: 'Quiero recomendar un shortlist de tours culturales en Bogotá para una pareja que viaja en abril y quiere algo premium pero no extremo.',
  },
  {
    label: 'Coffee lovers',
    text: 'Somos dos personas, nos gusta el café y queremos una experiencia tranquila con naturaleza y soporte humano por WhatsApp.',
  },
  {
    label: 'Captura de contacto',
    text: 'El viajero está interesado, pero todavía no va a pagar. Necesito un mensaje que capture email/WhatsApp y deje la puerta abierta a soporte humano.',
  },
  {
    label: 'Recuperar compra',
    text: 'El pago fue cancelado y necesito una respuesta elegante para recuperar la conversación y llevar al viajero de vuelta al checkout.',
  },
];

export function AdminAiLabClient() {
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: 'assistant',
      content:
        '## Resumen\nSoy el copiloto interno de KCE. Úsame para probar respuestas, recomendaciones, handoff y soporte con una estructura más clara.\n\n## Siguiente paso\nPruébame con un caso comercial, de soporte o de continuidad.',
    },
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const [attachLead, setAttachLead] = React.useState(false);
  const [wantHuman, setWantHuman] = React.useState(false);
  const [leadEmail, setLeadEmail] = React.useState('traveler@kce.test');
  const [leadWhatsapp, setLeadWhatsapp] = React.useState('+573001234567');
  const [meta, setMeta] = React.useState<ResponseMeta | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  function applyPreset(text: string) {
    setInput(text);
  }

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError('');
    setInput('');
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          ...(attachLead
            ? {
                lead: {
                  ...(leadEmail.trim() ? { email: leadEmail.trim() } : {}),
                  ...(leadWhatsapp.trim() ? { whatsapp: leadWhatsapp.trim() } : {}),
                  source: 'admin.ai-lab',
                },
                consent: true,
              }
            : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      const content = String(json?.content || json?.text || '').trim();
      setMessages([...next, { role: 'assistant', content: content || '(respuesta vacía)' }]);
      setMeta({
        provider: typeof json?.provider === 'string' ? json.provider : undefined,
        model: typeof json?.model === 'string' ? json.model : undefined,
        conversationId: typeof json?.conversationId === 'string' ? json.conversationId : undefined,
        ticketId: typeof json?.ticketId === 'string' ? json.ticketId : undefined,
      });
    } catch (e: any) {
      setError(String(e?.message || 'No se pudo llamar a /api/ai'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-[color:var(--color-text)]">AI Lab • concierge</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setMessages([
                {
                  role: 'assistant',
                  content:
                    '## Resumen\nListo. Empecemos de cero.\n\n## Siguiente paso\n¿Qué quieres probar ahora? (ticket/copy/tour/soporte)',
                },
              ]);
              setError('');
              setMeta(null);
            }}
          >
            Limpiar
          </Button>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              placeholder="email del viajero"
              className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[color:var(--color-text)] shadow-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black/30"
            />
            <input
              value={leadWhatsapp}
              onChange={(e) => setLeadWhatsapp(e.target.value)}
              placeholder="WhatsApp del viajero"
              className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[color:var(--color-text)] shadow-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black/30"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-[color:var(--color-text)]/75">
            <input type="checkbox" checked={attachLead} onChange={(e) => setAttachLead(e.target.checked)} className="size-4" />
            Adjuntar contacto
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-[color:var(--color-text)]/75">
            <input type="checkbox" checked={wantHuman} onChange={(e) => { const checked = e.target.checked; setWantHuman(checked); if (checked && !input.toLowerCase().includes('humano')) setInput((prev) => prev ? `${prev} Necesito ayuda humana.` : 'Necesito ayuda humana para continuar con la reserva.'); }} className="size-4" />
            Forzar ayuda humana
          </label>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">Casos sugeridos</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-[color:var(--color-text)] shadow-sm transition hover:bg-black/[0.03] dark:border-white/10 dark:bg-black/30 dark:hover:bg-white/[0.05]"
              onClick={() => applyPreset(preset.text)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {meta ? (
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {[
            ['Provider', meta.provider || '—'],
            ['Model', meta.model || '—'],
            ['Conversation', meta.conversationId || '—'],
            ['Ticket', meta.ticketId || '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-black/10 bg-white p-3 text-xs text-[color:var(--color-text)] shadow-sm dark:border-white/10 dark:bg-black/30">
              <div className="font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">{label}</div>
              <div className="mt-2 break-all text-[13px] font-medium text-[color:var(--color-text)]">{value}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 h-[52vh] min-h-[360px] overflow-auto rounded-xl border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="grid gap-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={[
                'max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                m.role === 'user'
                  ? 'ml-auto border border-[color:var(--brand-blue)]/15 bg-[color:var(--brand-blue)]/10 text-[color:var(--color-text)]'
                  : 'border border-black/10 bg-white text-[color:var(--color-text)] dark:border-white/10 dark:bg-black/40',
              ].join(' ')}
            >
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/45">
                {m.role === 'user' ? 'Prompt' : 'Respuesta IA'}
              </div>
              {m.role === 'assistant' ? <AssistantMessageBlocks content={m.content} /> : <ChatMarkdown content={m.content} />}
            </div>
          ))}
          {loading ? (
            <div className="max-w-[92%] rounded-2xl bg-white px-4 py-3 text-sm text-[color:var(--color-text)]/70 shadow-sm dark:bg-black/40">
              Generando respuesta…
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-200">
          {error}
          <div className="mt-1 text-[11px] text-red-700/80 dark:text-red-200/80">
            Si esto ocurre en producción: revisa <code className="font-mono">OPENAI_API_KEY</code> o{' '}
            <code className="font-mono">GEMINI_API_KEY</code> en Vercel.
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="Escribe un caso, prompt o situación… (Enter para enviar)"
          className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[color:var(--color-text)] shadow-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black/40"
        />
        <Button type="button" isLoading={loading} onClick={() => void send()} className="shrink-0">
          Enviar
        </Button>
      </div>

      <div className="mt-2 text-[11px] text-[color:var(--color-text)]/60">
        Nota: este laboratorio sirve para validar calidad de respuestas sin tocar la experiencia pública.
      </div>
    </section>
  );
}
