'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Network, Plus, RefreshCw, Target, Zap, 
  Clock, Activity, Trash2, Mail, Smartphone,
  ChevronRight, Terminal, Layers, ShieldCheck, Save,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE AUTOMATIZACIÓN ---
type Sequence = { id: string; key: string; name: string; status: 'draft' | 'active' | 'paused' | 'archived'; channel: 'email' | 'whatsapp' | 'mixed'; locale: string | null; description: string | null; };
type Step = { step_index: number; delay_minutes: number; channel: 'email' | 'whatsapp'; subject: string | null; body: string; };
type Enrollment = { id: string; sequence_id: string; status: string; current_step: number; next_run_at: string; lead_id: string | null; deal_id: string | null; metadata: Record<string, unknown>; created_at: string; last_error: string | null; };
type SequenceDetailResponse = { sequence: Sequence; steps: any[]; };

export function AdminSequencesClient() {
  const [items, setItems] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [showEnrollments, setShowEnrollments] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true); setMsg(null);
    try {
      const res = await adminFetch('/api/admin/sequences');
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Error en la sincronización'); } 
    finally { setLoading(false); }
  }, []);

  const loadDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/sequences/${id}`);
      const data = (await res.json()) as SequenceDetailResponse;
      setSelected(data.sequence);
      setSteps((data.steps || []).map((x: any) => ({
        step_index: x.step_index,
        delay_minutes: x.delay_minutes ?? 0,
        channel: x.channel || 'email',
        subject: x.subject || null,
        body: x.body || ''
      })));
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Fallo de acceso al nodo'); } 
    finally { setLoading(false); }
  };

  const loadEnrollments = async () => {
    try {
      const res = await adminFetch('/api/admin/sequences/enrollments?limit=50');
      const data = await res.json();
      setEnrollments(Array.isArray(data.items) ? data.items : []);
    } catch {}
  };

  useEffect(() => { refresh(); }, [refresh]);

  const signals = [
    { label: 'Blueprints', value: String(items.length), note: 'Estructuras de flujo.' },
    { label: 'Live Queue', value: String(enrollments.length), note: 'Viajeros en tránsito.' },
    { label: 'Cron Node', value: '15m', note: 'Frecuencia de inyección.' }
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE AUTOMATIZACIÓN */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Zap className="h-3.5 w-3.5" /> Growth Lane: /sequences-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Nodos de <span className="text-brand-yellow italic font-light">Automatización</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Consola de orquestación de mensajes. Diseña secuencias de goteo (Drip) para nutrir leads 
            y recuperar carritos abandonados con precisión multicanal.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => void refresh()} variant="outline" className="h-12 px-6 rounded-2xl border-brand-dark/10 shadow-sm font-bold uppercase tracking-widest text-[9px] bg-[color:var(--color-surface)]">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
          <Button onClick={() => void 0} className="h-12 px-8 rounded-2xl bg-brand-dark text-brand-yellow shadow-xl font-bold uppercase tracking-widest text-[9px] hover:scale-105 transition-transform">
            <Plus className="mr-2 h-4 w-4" /> Nueva Secuencia
          </Button>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Logic Orquestration"
        title="Escalado de Relaciones Premium"
        description="Cada paso es un touchpoint estratégico. El Cron Inyecta los mensajes en la cola cada 15 minutos. Asegúrate de que los Delays sean humanos."
        actions={[
          { href: '/admin/outbound', label: 'Ver Despacho', tone: 'primary' },
          { href: '/admin/marketing', label: 'Estrategia' }
        ]}
        signals={signals}
      />

      {/* TERMINAL DE DISEÑO (BÓVEDA) */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        <header className="p-8 border-b border-[color:var(--color-border)] flex items-center gap-4">
           <Network className="h-6 w-6 text-brand-blue" />
           <h2 className="font-heading text-2xl text-brand-blue uppercase tracking-tighter">Blueprint Designer</h2>
        </header>

        <div className="grid lg:grid-cols-12 gap-0">
          
          {/* COL 1: NAVEGADOR DE BLUEPRINTS */}
          <aside className="lg:col-span-3 border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/30 p-6 space-y-6">
            <div className="flex items-center justify-between px-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40">1. Seleccionar</span>
               <Search className="h-3.5 w-3.5 text-brand-blue/20" />
            </div>
            <div className="space-y-3">
               {items.map(s => (
                 <button 
                   key={s.id} 
                   onClick={() => void loadDetail(s.id)}
                   className={`w-full text-left p-5 rounded-[2rem] border transition-all group ${
                     selected?.id === s.id 
                       ? 'bg-brand-blue border-brand-blue text-white shadow-xl scale-[1.02]' 
                       : 'bg-[color:var(--color-surface)] border-[color:var(--color-border)] hover:border-brand-blue/20'
                   }`}
                 >
                    <p className={`text-xs font-bold uppercase tracking-tight mb-3 ${selected?.id === s.id ? 'text-white' : 'text-[color:var(--color-text)]'}`}>{s.name}</p>
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${
                         selected?.id === s.id ? 'bg-white/20 border-white/20' : 'bg-brand-blue/5 border-brand-blue/10 text-brand-blue'
                       }`}>{s.status}</span>
                       <span className={`text-[8px] font-mono uppercase opacity-50 ${selected?.id === s.id ? 'text-white' : ''}`}>{s.channel}</span>
                    </div>
                 </button>
               ))}
            </div>
          </aside>

          {/* COL 2: CONTROL DE NODO */}
          <div className="lg:col-span-3 border-r border-[color:var(--color-border)] p-8 space-y-10 bg-[color:var(--color-surface)]">
            <header className="space-y-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40">2. Parámetros</span>
               <h3 className="font-heading text-xl text-[color:var(--color-text)]">Configuración</h3>
            </header>

            {!selected ? (
              <div className="py-20 text-center opacity-20 italic text-sm">Selecciona un Blueprint.</div>
            ) : (
              <div className="space-y-8 animate-in fade-in">
                 <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] shadow-inner">
                       <p className="text-[8px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 mb-2">Internal_Key</p>
                       <p className="text-xs font-mono font-bold text-brand-blue truncate">{selected.key}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] shadow-inner">
                       <p className="text-[8px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 mb-2">Protocol_Status</p>
                       <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${selected.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <p className="text-[10px] font-bold uppercase tracking-widest">{selected.status}</p>
                       </div>
                    </div>
                 </div>
                 <div className="pt-8 border-t border-[color:var(--color-border)] space-y-3">
                    <Button variant="outline" className="w-full h-11 rounded-xl text-[9px] font-bold uppercase border-brand-blue/10 text-brand-blue bg-[color:var(--color-surface)]">Cambiar Protocolo</Button>
                    <Button variant="outline" className="w-full h-11 rounded-xl text-[9px] font-bold uppercase border-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white bg-[color:var(--color-surface)]">Archivar Nodo</Button>
                 </div>
              </div>
            )}
          </div>

          {/* COL 3: EDITOR DE PASOS (TIMELINE) */}
          <main className="lg:col-span-6 p-8 bg-[color:var(--color-surface-2)]/30 space-y-10">
            <header className="flex items-center justify-between">
               <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40">3. Línea de Tiempo</span>
                  <h3 className="font-heading text-xl text-[color:var(--color-text)]">Orquestación de Pasos</h3>
               </div>
               {selected && (
                 <Button onClick={() => setSteps([...steps, { step_index: steps.length, delay_minutes: 60, channel: 'email', subject: '', body: '' }])} variant="outline" className="h-9 px-4 rounded-xl text-[9px] font-bold uppercase border-brand-blue/20 text-brand-blue bg-[color:var(--color-surface)]">
                   + Añadir Paso
                 </Button>
               )}
            </header>

            {!selected ? (
              <div className="py-32 text-center">
                 <Layers className="h-12 w-12 mx-auto text-brand-blue/5 mb-6" />
                 <p className="text-sm font-light text-[color:var(--color-text)]/50 italic uppercase tracking-widest">Esperando Selección de Blueprint</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
                 {steps.map((st, i) => (
                   <div key={i} className="relative group p-8 rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm hover:shadow-xl transition-all">
                      {/* Badge de Indice */}
                      <div className="absolute -left-3 top-8 h-8 w-8 rounded-xl bg-brand-dark text-brand-yellow flex items-center justify-center font-heading text-xs shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                         {i + 1}
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                         <div className="space-y-1.5">
                            <label className="text-[8px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Delay (Minutes)</label>
                            <div className="relative">
                               <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-blue/30" />
                               <input type="number" className="w-full h-11 pl-11 pr-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-xs font-mono font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-inner" value={st.delay_minutes} onChange={(e) => setSteps(steps.map((x, idx) => idx === i ? {...x, delay_minutes: Number(e.target.value)} : x))} />
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[8px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Protocol_Channel</label>
                            <div className="relative">
                               {st.channel === 'email' ? <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-blue/30" /> : <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-blue/30" />}
                               <select className="w-full h-11 pl-11 pr-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[9px] font-bold uppercase tracking-widest text-brand-blue outline-none appearance-none cursor-pointer shadow-inner" value={st.channel} onChange={(e) => setSteps(steps.map((x, idx) => idx === i ? {...x, channel: e.target.value as any} : x))}>
                                  <option value="email">EMAIL_NODE</option>
                                  <option value="whatsapp">WHATSAPP_NODE</option>
                               </select>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         {st.channel === 'email' && (
                           <div className="space-y-1.5">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-brand-blue/40 ml-1">Subject_Line</label>
                              <input className="w-full h-11 px-5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-xs font-bold text-[color:var(--color-text)] outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" placeholder="Asunto del correo..." value={st.subject || ''} onChange={(e) => setSteps(steps.map((x, idx) => idx === i ? {...x, subject: e.target.value} : x))} />
                           </div>
                         )}
                         <div className="space-y-1.5">
                            <header className="flex justify-between items-center px-1">
                               <label className="text-[8px] font-bold uppercase tracking-widest text-brand-blue/40">Transmission_Body</label>
                               <Terminal className="h-3 w-3 text-brand-blue/20" />
                            </header>
                            <textarea className="w-full h-32 p-5 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] shadow-inner text-xs font-light leading-relaxed outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all resize-none italic text-[color:var(--color-text)]" placeholder="Contenido del mensaje..." value={st.body} onChange={(e) => setSteps(steps.map((x, idx) => idx === i ? {...x, body: e.target.value} : x))} />
                         </div>
                      </div>

                      <button onClick={() => setSteps(steps.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 h-8 w-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                   </div>
                 ))}
                 <Button onClick={() => setMsg('Snapshot_Saved')} className="w-full h-14 rounded-2xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-transform">
                    <Save className="mr-2 h-4 w-4" /> Guardar Orquestación
                 </Button>
                 {msg && <p className="text-xs text-center text-emerald-600 font-bold">{msg}</p>}
              </div>
            )}
          </main>
        </div>
      </section>

      {/* MONITOR EN VIVO (FORENSE) */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-brand-dark p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 relative z-10">
           <div className="flex items-center gap-6">
              <div className="h-14 w-14 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                 <Activity className="h-7 w-7 animate-pulse" />
              </div>
              <div>
                 <h3 className="font-heading text-3xl text-white tracking-tighter">Monitor de Transmisión</h3>
                 <p className="text-xs font-light text-white/40 italic mt-1">Rastreo forense de la cola activa de goteo.</p>
              </div>
           </div>
           <Button onClick={() => { setShowEnrollments(!showEnrollments); if (!showEnrollments) void loadEnrollments(); }} className="h-12 px-8 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-[9px] hover:bg-white/10 transition-all">
              {showEnrollments ? 'Cerrar Terminal' : 'Inspeccionar Tareas'}
           </Button>
        </header>

        {showEnrollments && (
          <div className="space-y-4 relative z-10 animate-in slide-in-from-top-4">
             <header className="flex items-center gap-2 mb-6">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">Live Execution Queue</span>
             </header>

             {enrollments.length === 0 ? (
               <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <p className="text-sm font-mono text-white/20 uppercase tracking-widest">No Active Enrollments Detected</p>
               </div>
             ) : (
               <div className="grid gap-3">
                  {enrollments.map((e) => (
                    <div key={e.id} className="group p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div className="flex items-center gap-6">
                          <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-emerald-400 shadow-inner group-hover:scale-105 transition-transform">
                             P{e.current_step}
                          </div>
                          <div className="space-y-1.5">
                             <div className="flex items-center gap-3">
                                <p className="text-xs font-mono font-bold text-white/80">{e.lead_id ? `LEAD_${e.lead_id.slice(0,8)}` : `DEAL_${e.deal_id?.slice(0,8)}`}</p>
                                <span className="text-[9px] font-mono text-white/20">TRACE_{e.id.slice(0,6)}</span>
                             </div>
                             {/* ✅ CORRECCIÓN DE TIPO BLINDADA */}
                             {!!(e.metadata as any)?.city && (
                                <p className="text-[10px] font-light text-white/40 italic flex items-center gap-2">
                                  <ChevronRight className="h-3 w-3 opacity-30" /> Destination Node: {String((e.metadata as any).city)}
                                </p>
                             )}
                          </div>
                       </div>
                       <div className="md:text-right border-l border-white/5 pl-6">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/50 mb-1">Próxima Inyección</p>
                          <p className="text-sm font-mono text-emerald-400">{new Date(e.next_run_at).toLocaleTimeString()}</p>
                       </div>
                    </div>
                  ))}
               </div>
             )}
             <footer className="pt-8 border-t border-white/5 flex justify-center">
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Cron Status: Running every 15m @ /api/admin/sequences/cron</p>
             </footer>
          </div>
        )}
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Logical Flow Verified
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Terminal className="h-3.5 w-3.5" /> Sequences Hub v3.1
        </div>
      </footer>
    </div>
  );
}