'use client';

import * as React from 'react';
import { ChatMarkdown } from '@/components/ChatMarkdown';
import { AssistantMessageBlocks } from '@/features/ai/AssistantMessageBlocks';
import {
  Bot,
  User,
  Trash2,
  Send,
  Zap,
  Activity,
  ShieldAlert,
  Cpu,
  Database,
  Terminal,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Msg = { role: 'user' | 'assistant'; content: string };
type ResponseMeta = {
  provider?: string;
  model?: string;
  conversationId?: string;
  ticketId?: string;
};

type AiApiResponse = {
  error?: string;
  content?: string;
  text?: string;
  provider?: string;
  model?: string;
  conversationId?: string;
  ticketId?: string;
};

const PRESETS = [
  {
    label: 'Shortlist Cultural',
    text: 'Recomienda un shortlist de tours culturales en Bogotá para una pareja que viaja en abril. Quieren algo premium, auténtico y con poco esfuerzo físico.',
  },
  {
    label: 'Experiencia Café',
    text: 'Somos dos personas amantes del café. Buscamos una finca privada, naturaleza y queremos saber si el guía habla alemán.',
  },
  {
    label: 'Captura (Lead Gen)',
    text: 'Me interesan los tours de Cartagena pero no estoy listo para pagar. ¿Qué opciones de seguimiento me das?',
  },
  {
    label: 'Fallo de Pago',
    text: 'Intenté pagar con mi tarjeta pero fue rechazada. Necesito una solución elegante para no perder mi reserva.',
  },
];

export function AdminAiLabClient() {
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: 'assistant',
      content:
        '## Sandbox Cognitivo Iniciado\nSoy el motor de inferencia de KCE. Estoy listo para simular escenarios comerciales, validar reglas del Playbook y probar el flujo de escalamiento humano.\n\n**¿Qué deseas validar hoy?**',
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
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const autoScroll = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  React.useEffect(() => {
    autoScroll();
  }, [messages.length, loading]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [input]);

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

      const json = (await res.json().catch(() => ({}))) as AiApiResponse;

      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      const content = String(json.content || json.text || '').trim();
      setMessages([
        ...next,
        { role: 'assistant', content: content || '(Sin respuesta del modelo)' },
      ]);

      setMeta({
        ...(json.provider !== undefined && { provider: json.provider }),
        ...(json.model !== undefined && { model: json.model }),
        ...(json.conversationId !== undefined && { conversationId: json.conversationId }),
        ...(json.ticketId !== undefined && { ticketId: json.ticketId }),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Falla de conexión con el núcleo de IA.');
    } finally {
      setLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
      }
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 pb-24 duration-700">
      {/* PANEL DE CONTROL TÁCTICO */}
      <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5">
        <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-[0.02]">
          <Cpu className="h-64 w-64 text-brand-blue" />
        </div>

        <div className="relative z-10">
          <header className="mb-10 flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-8 dark:border-white/5 xl:flex-row xl:items-end">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
                  <Bot className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-3xl tracking-tight text-main md:text-4xl">
                  AI Lab <span className="font-light italic text-brand-yellow">Sandbox</span>
                </h2>
              </div>
              <p className="mt-2 max-w-xl text-sm font-light text-muted">
                Simulador de interacciones. Afina el comportamiento de los agentes y valida la
                comprensión de contexto en tiempo real.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setMessages([
                  {
                    role: 'assistant',
                    content:
                      '## Memoria Purificada\nEl contexto ha sido reiniciado. Listo para una nueva secuencia.',
                  },
                ]);
                setMeta(null);
                setError('');
              }}
              className="group flex h-12 items-center gap-2 rounded-full border-rose-500/20 bg-rose-50 px-6 text-[10px] font-bold uppercase tracking-widest text-rose-600 shadow-sm transition-all hover:border-transparent hover:bg-rose-500 hover:text-white dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-600"
            >
              <Trash2 className="h-4 w-4 transition-transform group-hover:rotate-12" /> Limpiar
              Sesión
            </Button>
          </header>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Simulación de Lead */}
            <div className="rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface-2 p-8 dark:border-white/5">
              <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                <Database className="h-3.5 w-3.5" /> Telemetría del Viajero
              </div>
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-muted">
                    Email Simulado
                  </label>
                  <input
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    disabled={!attachLead}
                    className="w-full rounded-xl border border-brand-dark/10 bg-surface px-4 py-3 text-sm font-bold text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-50 dark:border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-muted">
                    WhatsApp (E.164)
                  </label>
                  <input
                    value={leadWhatsapp}
                    onChange={(e) => setLeadWhatsapp(e.target.value)}
                    disabled={!attachLead}
                    className="w-full rounded-xl border border-brand-dark/10 bg-surface px-4 py-3 text-sm font-bold text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-50 dark:border-white/10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 border-t border-brand-dark/5 pt-6 dark:border-white/5">
                <label className="group flex cursor-pointer items-center gap-3 text-xs font-bold text-main">
                  <input
                    type="checkbox"
                    checked={attachLead}
                    onChange={(e) => setAttachLead(e.target.checked)}
                    className="h-5 w-5 rounded-md border-brand-dark/20 text-brand-blue transition-all focus:ring-brand-blue"
                  />
                  <span className="transition-colors group-hover:text-brand-blue">
                    Inyectar Identidad
                  </span>
                </label>
                <label className="group flex cursor-pointer items-center gap-3 text-xs font-bold text-main">
                  <input
                    type="checkbox"
                    checked={wantHuman}
                    onChange={(e) => {
                      const c = e.target.checked;
                      setWantHuman(c);
                      if (c)
                        setInput((p) =>
                          p
                            ? `${p} Solicito hablar con un humano.`
                            : 'Quiero hablar con un agente humano ahora.',
                        );
                    }}
                    className="h-5 w-5 rounded-md border-brand-dark/20 text-brand-blue transition-all focus:ring-brand-blue"
                  />
                  <span className="transition-colors group-hover:text-brand-blue">
                    Forzar Handoff Humano
                  </span>
                </label>
              </div>
            </div>

            {/* Casos de Uso */}
            <div className="rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface-2 p-8 dark:border-white/5">
              <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                <Zap className="h-3.5 w-3.5" /> Escenarios Preconfigurados
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setInput(p.text)}
                    className="group flex items-center justify-between rounded-xl border border-brand-dark/5 bg-surface px-4 py-3 text-left text-xs font-bold text-main transition-all hover:border-brand-blue/30 hover:bg-brand-blue/5 hover:text-brand-blue hover:shadow-sm dark:border-white/5"
                  >
                    {p.label}
                    <ChevronRight className="h-4 w-4 opacity-30 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TERMINAL DE CHAT */}
      <section className="flex h-[75vh] min-h-[600px] flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        {/* Telemetría de Respuesta (Sticky Top) */}
        {meta && (
          <div className="flex flex-wrap items-center gap-6 border-b border-brand-dark bg-brand-dark px-8 py-3">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-yellow">
              <Activity className="h-3.5 w-3.5 animate-pulse" /> Telemetría AI
            </div>
            {[
              ['Model', meta.model || 'Unknown'],
              ['Provider', meta.provider || 'Direct'],
              ['Ticket', meta.ticketId || 'None'],
            ].map(([label, val]) => (
              <div
                key={label}
                className="font-mono text-[10px] uppercase text-white/40"
              >
                <span className="mr-1.5 text-white/20">{label}:</span>
                <span className="text-brand-yellow/90">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Zona de Mensajes */}
        <div className="bg-surface-2/10 custom-scrollbar flex-1 space-y-8 overflow-y-auto p-6 md:p-10">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex max-w-[90%] flex-col md:max-w-[80%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] ${isUser ? 'text-muted' : 'text-brand-blue'}`}
                >
                  {isUser ? (
                    <>
                      <User className="h-3 w-3" /> Prompter
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3" /> AI Core
                    </>
                  )}
                </div>
                <div
                  className={`px-6 py-5 text-sm leading-relaxed shadow-soft md:text-base ${
                    isUser
                      ? 'rounded-[2rem] rounded-tr-sm bg-brand-blue text-white'
                      : 'rounded-[2rem] rounded-tl-sm border border-brand-dark/5 bg-surface text-main dark:border-white/5'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <AssistantMessageBlocks content={m.content} />
                  ) : (
                    <ChatMarkdown content={m.content} />
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="mr-auto flex flex-col items-start">
              <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                <Bot className="h-3 w-3 animate-spin" /> Inferencia en curso...
              </div>
              <div className="flex h-14 items-center gap-2 rounded-[2rem] rounded-tl-sm border border-brand-dark/5 bg-surface px-6 py-5 shadow-sm dark:border-white/5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-yellow" />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-brand-yellow"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-brand-yellow"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          )}
          <div
            ref={endRef}
            className="h-2"
          />
        </div>

        {/* ÁREA DE INYECCIÓN DE PROMPTS */}
        <div className="bg-surface-2/50 relative shrink-0 border-t border-brand-dark/5 p-6 dark:border-white/5 md:p-8">
          {error && (
            <div className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-10 right-10 mb-6 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-50 p-4 text-xs font-bold text-rose-600 shadow-xl dark:bg-rose-900/20 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5 shrink-0" /> {error}
            </div>
          )}

          <div className="relative flex items-end gap-4 rounded-3xl border border-brand-dark/10 bg-surface p-3 shadow-soft transition-all focus-within:border-brand-blue/50 focus-within:ring-4 focus-within:ring-brand-blue/5 dark:border-white/10">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Escribe el prompt del viajero aquí..."
              className="placeholder:text-muted/50 custom-scrollbar max-h-[150px] w-full resize-none bg-transparent px-4 py-3 text-sm text-main outline-none md:text-base"
            />
            <Button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-md transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            >
              <Send className="ml-0.5 h-5 w-5" />
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted">
            <Terminal className="h-3 w-3 opacity-50" /> Sandbox Local • KCE Intelligence v2.6
          </div>
        </div>
      </section>
    </div>
  );
}
