'use client';

import * as React from 'react';
import { ChatMarkdown } from '@/components/ChatMarkdown';
import { AssistantMessageBlocks } from '@/features/ai/AssistantMessageBlocks';
import { 
  Bot, User, Trash2, Send, Zap, Activity, 
  ShieldAlert, Cpu, Database, Terminal, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Msg = { role: 'user' | 'assistant'; content: string };
type ResponseMeta = {
  provider?: string;
  model?: string;
  conversationId?: string;
  ticketId?: string;
};

// Tipado seguro para la respuesta de la API
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
  
  // Controles de Simulación
  const [attachLead, setAttachLead] = React.useState(false);
  const [wantHuman, setWantHuman] = React.useState(false);
  const [leadEmail, setLeadEmail] = React.useState('traveler@kce.test');
  const [leadWhatsapp, setLeadWhatsapp] = React.useState('+573001234567');
  
  const [meta, setMeta] = React.useState<ResponseMeta | null>(null);
  
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const autoScroll = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  React.useEffect(() => { autoScroll(); }, [messages.length, loading]);

  // Truco UX Pro: Auto-ajustar altura del textarea según el contenido
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
          ...(attachLead ? {
            lead: {
              ...(leadEmail.trim() ? { email: leadEmail.trim() } : {}),
              ...(leadWhatsapp.trim() ? { whatsapp: leadWhatsapp.trim() } : {}),
              source: 'admin.ai-lab',
            },
            consent: true,
          } : {}),
        }),
      });
      
      const json = (await res.json().catch(() => ({}))) as AiApiResponse;
      
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      
      const content = String(json.content || json.text || '').trim();
      setMessages([...next, { role: 'assistant', content: content || '(Sin respuesta del modelo)' }]);
      
      // SOLUCIÓN APLICADA: Spread Condicional para cumplir exactOptionalPropertyTypes
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
      // Resetear la altura del textarea después de enviar
      if (textareaRef.current) {
         textareaRef.current.style.height = 'inherit';
      }
    }
  }

  return (
    <div className="space-y-8 pb-24">
      
      {/* PANEL DE CONTROL TÁCTICO */}
      <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <Cpu className="h-64 w-64 text-brand-blue" />
        </div>

        <div className="relative z-10">
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10 border-b border-[var(--color-border)] pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg shadow-brand-blue/20">
                  <Bot className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-3xl text-brand-blue">AI Lab <span className="text-brand-yellow italic font-light">Sandbox</span></h2>
              </div>
              <p className="text-sm text-[var(--color-text)]/50 font-light">Afinación de comportamiento y validación de contexto bilingüe.</p>
            </div>
            
            <button
              onClick={() => {
                setMessages([{ role: 'assistant', content: '## Memoria Purificada\nEl contexto ha sido reiniciado. Listo para una nueva secuencia.' }]);
                setMeta(null);
                setError('');
              }}
              className="group flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-rose-600 transition-all hover:bg-rose-500 hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" /> Limpiar Sesión
            </button>
          </header>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Simulación de Lead */}
            <div className="rounded-[2.5rem] bg-[var(--color-surface-2)] p-8 border border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                <Database className="h-3.5 w-3.5" /> Telemetría del Viajero
              </div>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-[var(--color-text)]/40 ml-1">Email Simulado</label>
                  <input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} disabled={!attachLead} className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 outline-none disabled:opacity-30 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-[var(--color-text)]/40 ml-1">WhatsApp (E.164)</label>
                  <input value={leadWhatsapp} onChange={(e) => setLeadWhatsapp(e.target.value)} disabled={!attachLead} className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 outline-none disabled:opacity-30 transition-all" />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 pt-4 border-t border-[var(--color-border)]/50">
                <label className="flex items-center gap-3 text-xs font-bold text-brand-blue/70 cursor-pointer group">
                  <input type="checkbox" checked={attachLead} onChange={(e) => setAttachLead(e.target.checked)} className="h-5 w-5 rounded-lg border-[var(--color-border)] text-brand-blue focus:ring-brand-blue transition-all" />
                  <span className="group-hover:text-brand-blue">Inyectar Identidad</span>
                </label>
                <label className="flex items-center gap-3 text-xs font-bold text-brand-blue/70 cursor-pointer group">
                  <input type="checkbox" checked={wantHuman} onChange={(e) => {
                    const c = e.target.checked;
                    setWantHuman(c);
                    if (c) setInput((p) => p ? `${p} Solicito hablar con un humano.` : 'Quiero hablar con un agente humano ahora.');
                  }} className="h-5 w-5 rounded-lg border-[var(--color-border)] text-brand-blue focus:ring-brand-blue transition-all" />
                  <span className="group-hover:text-brand-blue">Forzar Handoff</span>
                </label>
              </div>
            </div>

            {/* Casos de Uso */}
            <div className="rounded-[2.5rem] bg-[var(--color-surface-2)] p-8 border border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                <Zap className="h-3.5 w-3.5" /> Escenarios Preconfigurados
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setInput(p.text)}
                    className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-left text-xs font-bold text-brand-blue transition-all hover:border-brand-blue/40 hover:bg-brand-blue/5 hover:shadow-md group"
                  >
                    {p.label}
                    <ChevronRight className="h-3 w-3 text-brand-blue/20 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TERMINAL DE CHAT */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl flex flex-col h-[75vh] min-h-[600px] overflow-hidden">
        
        {/* Telemetría de Respuesta (Sticky Top) */}
        {meta && (
          <div className="bg-brand-dark px-8 py-3 flex flex-wrap gap-6 items-center border-b border-white/5">
             <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-yellow">
                <Activity className="h-3 w-3 animate-pulse" /> Telemetría AI
             </div>
             {[
               ['Model', meta.model || 'Unknown'],
               ['Provider', meta.provider || 'Direct'],
               ['Ticket', meta.ticketId || 'None']
             ].map(([label, val]) => (
               <div key={label} className="text-[10px] font-mono text-white/40">
                 <span className="text-white/20 mr-1.5">{label}:</span>
                 <span className="text-brand-yellow/80">{val}</span>
               </div>
             ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div key={idx} className={`flex flex-col max-w-[90%] md:max-w-[80%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                <div className={`mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] ${isUser ? 'text-brand-blue/50' : 'text-brand-yellow'}`}>
                  {isUser ? <><User className="h-3.5 w-3.5" /> Operator Prompt</> : <><Bot className="h-3.5 w-3.5" /> Intelligence Response</>}
                </div>
                <div className={`rounded-[2.5rem] px-8 py-6 text-base leading-relaxed shadow-xl ${
                  isUser 
                    ? 'rounded-tr-lg bg-brand-blue text-white' 
                    : 'rounded-tl-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]'
                }`}>
                  {m.role === 'assistant' ? <AssistantMessageBlocks content={m.content} /> : <ChatMarkdown content={m.content} />}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="flex flex-col items-start mr-auto">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                <Bot className="h-3.5 w-3.5 animate-spin" /> Thinking...
              </div>
              <div className="rounded-[2.5rem] rounded-tl-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-8 py-6 shadow-sm flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-yellow animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-brand-yellow animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="h-2 w-2 rounded-full bg-brand-yellow animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={endRef} className="h-4" />
        </div>

        {/* ÁREA DE INYECCIÓN DE PROMPTS */}
        <div className="p-6 md:p-10 bg-[var(--color-surface-2)] border-t border-[var(--color-border)] relative">
          {error && (
            <div className="absolute bottom-full left-10 right-10 mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs font-bold text-rose-600 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
              <ShieldAlert className="h-5 w-5" /> {error}
            </div>
          )}
          
          <div className="relative flex items-end gap-4 rounded-[2rem] border border-[var(--color-border)] bg-white p-3 shadow-2xl focus-within:ring-4 focus-within:ring-brand-blue/5 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              rows={1}
              placeholder="Simula un mensaje del viajero..."
              className="w-full resize-none bg-transparent px-5 py-4 text-base outline-none max-h-[150px] font-light text-brand-dark"
            />
            <Button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg hover:scale-105 transition-all disabled:opacity-20"
            >
              <Send className="h-6 w-6 ml-1" />
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-[var(--color-text)]/30 font-bold uppercase tracking-widest">
            <Terminal className="h-3 w-3" /> Sandbox Environment • KCE Intelligence v2.6
          </div>
        </div>

      </section>
    </div>
  );
}