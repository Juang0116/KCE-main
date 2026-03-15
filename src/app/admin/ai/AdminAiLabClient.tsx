'use client';

import * as React from 'react';
import { ChatMarkdown } from '@/components/ChatMarkdown';
import { AssistantMessageBlocks } from '@/features/ai/AssistantMessageBlocks';
import { Bot, User, Trash2, Send, Zap, Activity, Info } from 'lucide-react';

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
        '## Sistema Iniciado\nSoy el copiloto interno de KCE. Úsame para simular casos comerciales, probar la calibración de respuestas y validar el flujo de escalamiento a humanos.\n\n## Listo para pruebas\nEscribe un prompt abajo o selecciona un caso preconfigurado.',
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
      setError(String(e?.message || 'No se pudo contactar al proveedor de IA.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header y Controles de Simulación */}
      <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8 border-b border-[var(--color-border)] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">AI Lab / Sandbox</h2>
            </div>
            <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">Simula conversaciones y afina el comportamiento del Concierge antes de llevarlo a producción.</p>
          </div>
          <button
            onClick={() => {
              setMessages([{ role: 'assistant', content: '## Sistema Reiniciado\nMemoria limpiada. Listo para una nueva simulación.' }]);
              setError('');
              setMeta(null);
            }}
            className="flex h-10 w-full xl:w-auto items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-50 px-5 text-[10px] font-bold uppercase tracking-widest text-rose-600 transition hover:bg-rose-100"
          >
            <Trash2 className="h-3 w-3" /> Limpiar Contexto
          </button>
        </div>

        {/* Panel de Configuración de Sesión */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
              <User className="h-3 w-3" /> Contexto del Viajero Simulado
            </div>
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <label>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/40 block mb-1">Email Simulado</span>
                <input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} disabled={!attachLead} className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white/50 px-3 text-sm outline-none focus:border-brand-blue transition-colors disabled:opacity-50" />
              </label>
              <label>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/40 block mb-1">WhatsApp Simulado</span>
                <input value={leadWhatsapp} onChange={(e) => setLeadWhatsapp(e.target.value)} disabled={!attachLead} className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white/50 px-3 text-sm outline-none focus:border-brand-blue transition-colors disabled:opacity-50" />
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 border-t border-[var(--color-border)] pt-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)]/70 cursor-pointer">
                <input type="checkbox" checked={attachLead} onChange={(e) => setAttachLead(e.target.checked)} className="h-4 w-4 accent-brand-blue" /> Inyectar Lead en el Prompt
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text)]/70 cursor-pointer">
                <input type="checkbox" checked={wantHuman} onChange={(e) => { const c = e.target.checked; setWantHuman(c); if (c && !input.toLowerCase().includes('humano')) setInput((prev) => prev ? `${prev} Necesito ayuda humana.` : 'Necesito ayuda humana para reservar.'); }} className="h-4 w-4 accent-brand-blue" /> Forzar Handoff Humano
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
              <Zap className="h-3 w-3" /> Casos de Prueba (Presets)
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.text)}
                  className="rounded-xl border border-brand-blue/20 bg-white/60 px-4 py-2.5 text-xs font-semibold text-brand-blue transition hover:bg-brand-blue/10 hover:border-brand-blue/40"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metadatos de la Respuesta (Si existen) */}
        {meta && (
          <div className="mt-6 flex flex-wrap gap-3 p-4 rounded-2xl bg-brand-blue/5 border border-brand-blue/15">
            <div className="flex items-center gap-2 mr-4 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
              <Activity className="h-3 w-3" /> Última Ejecución
            </div>
            {[
              ['Modelo', meta.model || '—'],
              ['Proveedor', meta.provider || '—'],
              ['Handoff Ticket', meta.ticketId || '—'],
            ].map(([label, value]) => (
              <div key={label} className="bg-white/60 border border-brand-blue/10 px-3 py-1 rounded-lg text-xs">
                <span className="font-semibold text-[var(--color-text)]/50 mr-2">{label}:</span>
                <span className="font-mono text-brand-blue">{value}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ventana de Chat */}
      <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6 shadow-lg flex flex-col h-[65vh] min-h-[500px]">
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div key={idx} className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isUser ? 'text-brand-blue' : 'text-[var(--color-text)]/40'}`}>
                  {isUser ? <><User className="h-3 w-3" /> Prompt Simulado</> : <><Bot className="h-3 w-3" /> Concierge AI</>}
                </div>
                <div className={`rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${isUser ? 'rounded-tr-sm bg-brand-blue text-white' : 'rounded-tl-sm border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]'}`}>
                  {m.role === 'assistant' ? <AssistantMessageBlocks content={m.content} /> : <ChatMarkdown content={m.content} />}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="flex flex-col items-start max-w-[85%] mr-auto">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
                <Bot className="h-3 w-3" /> Concierge AI
              </div>
              <div className="rounded-3xl rounded-tl-sm border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 shadow-sm flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-blue/50 animate-bounce"></div>
                <div className="h-2 w-2 rounded-full bg-brand-blue/50 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="h-2 w-2 rounded-full bg-brand-blue/50 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
          <div ref={endRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="mt-4 border-t border-[var(--color-border)] pt-4 relative">
          {error && (
            <div className="absolute bottom-full mb-4 w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-700 shadow-lg">
              ❌ {error}
            </div>
          )}
          
          <div className="flex items-end gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2 shadow-inner focus-within:border-brand-blue/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              rows={1}
              placeholder="Escribe aquí para simular el comportamiento de la IA... (Enter para enviar)"
              className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none max-h-[120px] overflow-y-auto"
            />
            <button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white transition hover:bg-brand-blue/90 disabled:opacity-50 shadow-md"
            >
              <Send className="h-5 w-5 ml-1" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[var(--color-text)]/40 font-semibold uppercase tracking-widest">
            <Info className="h-3 w-3" /> Las interacciones aquí no afectan la base de datos pública de KCE.
          </div>
        </div>

      </section>
    </div>
  );
}