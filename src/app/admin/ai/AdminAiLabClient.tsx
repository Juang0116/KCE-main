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

  React.useEffect(() => { autoScroll(); }, [messages.length, loading]);

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
    <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* PANEL DE CONTROL TÁCTICO */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Cpu className="h-64 w-64 text-brand-blue" />
        </div>

        <div className="relative z-10">
          <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-10 border-b border-brand-dark/5 dark:border-white/5 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
                  <Bot className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight">
                  AI Lab <span className="text-brand-yellow italic font-light">Sandbox</span>
                </h2>
              </div>
              <p className="text-sm text-muted font-light mt-2 max-w-xl">
                Simulador de interacciones. Afina el comportamiento de los agentes y valida la comprensión de contexto en tiempo real.
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                setMessages([{ role: 'assistant', content: '## Memoria Purificada\nEl contexto ha sido reiniciado. Listo para una nueva secuencia.' }]);
                setMeta(null);
                setError('');
              }}
              className="group flex items-center gap-2 rounded-full border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-6 h-12 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 transition-all hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 hover:border-transparent shadow-sm"
            >
              <Trash2 className="h-4 w-4 transition-transform group-hover:rotate-12" /> Limpiar Sesión
            </Button>
          </header>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Simulación de Lead */}
            <div className="rounded-[var(--radius-2xl)] bg-surface-2 p-8 border border-brand-dark/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                <Database className="h-3.5 w-3.5" /> Telemetría del Viajero
              </div>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-muted ml-1 tracking-widest">Email Simulado</label>
                  <input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} disabled={!attachLead} className="w-full rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface px-4 py-3 text-sm font-bold text-main focus:ring-2 focus:ring-brand-blue/20 outline-none disabled:opacity-50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase text-muted ml-1 tracking-widest">WhatsApp (E.164)</label>
                  <input value={leadWhatsapp} onChange={(e) => setLeadWhatsapp(e.target.value)} disabled={!attachLead} className="w-full rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface px-4 py-3 text-sm font-bold text-main focus:ring-2 focus:ring-brand-blue/20 outline-none disabled:opacity-50 transition-all" />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 pt-6 border-t border-brand-dark/5 dark:border-white/5">
                <label className="flex items-center gap-3 text-xs font-bold text-main cursor-pointer group">
                  <input type="checkbox" checked={attachLead} onChange={(e) => setAttachLead(e.target.checked)} className="h-5 w-5 rounded-md border-brand-dark/20 text-brand-blue focus:ring-brand-blue transition-all" />
                  <span className="group-hover:text-brand-blue transition-colors">Inyectar Identidad</span>
                </label>
                <label className="flex items-center gap-3 text-xs font-bold text-main cursor-pointer group">
                  <input type="checkbox" checked={wantHuman} onChange={(e) => {
                    const c = e.target.checked;
                    setWantHuman(c);
                    if (c) setInput((p) => p ? `${p} Solicito hablar con un humano.` : 'Quiero hablar con un agente humano ahora.');
                  }} className="h-5 w-5 rounded-md border-brand-dark/20 text-brand-blue focus:ring-brand-blue transition-all" />
                  <span className="group-hover:text-brand-blue transition-colors">Forzar Handoff Humano</span>
                </label>
              </div>
            </div>

            {/* Casos de Uso */}
            <div className="rounded-[var(--radius-2xl)] bg-surface-2 p-8 border border-brand-dark/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                <Zap className="h-3.5 w-3.5" /> Escenarios Preconfigurados
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setInput(p.text)}
                    className="flex items-center justify-between rounded-xl border border-brand-dark/5 dark:border-white/5 bg-surface px-4 py-3 text-left text-xs font-bold text-main transition-all hover:border-brand-blue/30 hover:bg-brand-blue/5 hover:text-brand-blue hover:shadow-sm group"
                  >
                    {p.label}
                    <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TERMINAL DE CHAT */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop flex flex-col h-[75vh] min-h-[600px] overflow-hidden">
        
        {/* Telemetría de Respuesta (Sticky Top) */}
        {meta && (
          <div className="bg-brand-dark px-8 py-3 flex flex-wrap gap-6 items-center border-b border-brand-dark">
             <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-yellow">
                <Activity className="h-3.5 w-3.5 animate-pulse" /> Telemetría AI
             </div>
             {[
               ['Model', meta.model || 'Unknown'],
               ['Provider', meta.provider || 'Direct'],
               ['Ticket', meta.ticketId || 'None']
             ].map(([label, val]) => (
               <div key={label} className="text-[10px] font-mono text-white/40 uppercase">
                 <span className="text-white/20 mr-1.5">{label}:</span>
                 <span className="text-brand-yellow/90">{val}</span>
               </div>
             ))}
          </div>
        )}

        {/* Zona de Mensajes */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-surface-2/10 custom-scrollbar">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div key={idx} className={`flex flex-col max-w-[90%] md:max-w-[80%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                <div className={`mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] ${isUser ? 'text-muted' : 'text-brand-blue'}`}>
                  {isUser ? <><User className="h-3 w-3" /> Prompter</> : <><Bot className="h-3 w-3" /> AI Core</>}
                </div>
                <div className={`px-6 py-5 text-sm md:text-base leading-relaxed shadow-soft ${
                  isUser 
                    ? 'rounded-[2rem] rounded-tr-sm bg-brand-blue text-white' 
                    : 'rounded-[2rem] rounded-tl-sm border border-brand-dark/5 dark:border-white/5 bg-surface text-main'
                }`}>
                  {m.role === 'assistant' ? <AssistantMessageBlocks content={m.content} /> : <ChatMarkdown content={m.content} />}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="flex flex-col items-start mr-auto">
              <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                <Bot className="h-3 w-3 animate-spin" /> Inferencia en curso...
              </div>
              <div className="rounded-[2rem] rounded-tl-sm border border-brand-dark/5 dark:border-white/5 bg-surface px-6 py-5 shadow-sm flex items-center gap-2 h-14">
                <div className="h-2 w-2 rounded-full bg-brand-yellow animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-brand-yellow animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="h-2 w-2 rounded-full bg-brand-yellow animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={endRef} className="h-2" />
        </div>

        {/* ÁREA DE INYECCIÓN DE PROMPTS */}
        <div className="p-6 md:p-8 bg-surface-2/50 border-t border-brand-dark/5 dark:border-white/5 relative shrink-0">
          {error && (
            <div className="absolute bottom-full left-10 right-10 mb-6 rounded-2xl border border-rose-500/20 bg-rose-50 dark:bg-rose-900/20 p-4 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
              <ShieldAlert className="h-5 w-5 shrink-0" /> {error}
            </div>
          )}
          
          <div className="relative flex items-end gap-4 rounded-3xl border border-brand-dark/10 dark:border-white/10 bg-surface p-3 shadow-soft focus-within:border-brand-blue/50 focus-within:ring-4 focus-within:ring-brand-blue/5 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              rows={1}
              placeholder="Escribe el prompt del viajero aquí..."
              className="w-full resize-none bg-transparent px-4 py-3 text-sm md:text-base outline-none max-h-[150px] text-main placeholder:text-muted/50 custom-scrollbar"
            />
            <Button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-md hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100"
            >
              <Send className="h-5 w-5 ml-0.5" />
            </Button>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-muted font-bold uppercase tracking-widest">
            <Terminal className="h-3 w-3 opacity-50" /> Sandbox Local • KCE Intelligence v2.6
          </div>
        </div>

      </section>
    </div>
  );
}