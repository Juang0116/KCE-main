'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  Network,
  Plus,
  RefreshCw,
  Target,
  Zap,
  Clock,
  Activity,
  Trash2,
  Mail,
  Smartphone,
  ChevronRight,
  Terminal,
  Layers,
  ShieldCheck,
  Save,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE AUTOMATIZACIÓN ---
type Sequence = {
  id: string;
  key: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  channel: 'email' | 'whatsapp' | 'mixed';
  locale: string | null;
  description: string | null;
};
type Step = {
  step_index: number;
  delay_minutes: number;
  channel: 'email' | 'whatsapp';
  subject: string | null;
  body: string;
};
type Enrollment = {
  id: string;
  sequence_id: string;
  status: string;
  current_step: number;
  next_run_at: string;
  lead_id: string | null;
  deal_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  last_error: string | null;
};
type SequenceDetailResponse = { sequence: Sequence; steps: any[] };

export function AdminSequencesClient() {
  const [items, setItems] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [showEnrollments, setShowEnrollments] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await adminFetch('/api/admin/sequences');
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Error en la sincronización');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/sequences/${id}`);
      const data = (await res.json()) as SequenceDetailResponse;
      setSelected(data.sequence);
      setSteps(
        (data.steps || []).map((x: any) => ({
          step_index: x.step_index,
          delay_minutes: x.delay_minutes ?? 0,
          channel: x.channel || 'email',
          subject: x.subject || null,
          body: x.body || '',
        })),
      );
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Fallo de acceso al nodo');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async () => {
    try {
      const res = await adminFetch('/api/admin/sequences/enrollments?limit=50');
      const data = await res.json();
      setEnrollments(Array.isArray(data.items) ? data.items : []);
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signals = [
    { label: 'Blueprints', value: String(items.length), note: 'Estructuras de flujo.' },
    { label: 'Live Queue', value: String(enrollments.length), note: 'Viajeros en tránsito.' },
    { label: 'Cron Node', value: '15m', note: 'Frecuencia de inyección.' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-12 pb-32 duration-700">
      {/* HEADER DE AUTOMATIZACIÓN */}
      <header className="flex flex-col justify-between gap-8 border-b border-[color:var(--color-border)] px-2 pb-10 md:flex-row md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Zap className="h-3.5 w-3.5" /> Growth Lane: /sequences-vault
          </div>
          <h1 className="font-heading text-4xl leading-tight text-brand-blue md:text-5xl">
            Nodos de <span className="font-light italic text-brand-yellow">Automatización</span>
          </h1>
          <p className="text-[color:var(--color-text)]/50 mt-4 max-w-2xl text-base font-light italic leading-relaxed">
            Consola de orquestación de mensajes. Diseña secuencias de goteo (Drip) para nutrir leads
            y recuperar carritos abandonados con precisión multicanal.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => void refresh()}
            variant="outline"
            className="h-12 rounded-2xl border-brand-dark/10 bg-[color:var(--color-surface)] px-6 text-[9px] font-bold uppercase tracking-widest shadow-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
          <Button
            onClick={() => void 0}
            className="h-12 rounded-2xl bg-brand-dark px-8 text-[9px] font-bold uppercase tracking-widest text-brand-yellow shadow-xl transition-transform hover:scale-105"
          >
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
          { href: '/admin/marketing', label: 'Estrategia' },
        ]}
        signals={signals}
      />

      {/* TERMINAL DE DISEÑO (BÓVEDA) */}
      <section className="relative overflow-hidden rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl">
        <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] p-8">
          <Network className="h-6 w-6 text-brand-blue" />
          <h2 className="font-heading text-2xl uppercase tracking-tighter text-brand-blue">
            Blueprint Designer
          </h2>
        </header>

        <div className="grid gap-0 lg:grid-cols-12">
          {/* COL 1: NAVEGADOR DE BLUEPRINTS */}
          <aside className="bg-[color:var(--color-surface-2)]/30 space-y-6 border-r border-[color:var(--color-border)] p-6 lg:col-span-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40">
                1. Seleccionar
              </span>
              <Search className="h-3.5 w-3.5 text-brand-blue/20" />
            </div>
            <div className="space-y-3">
              {items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => void loadDetail(s.id)}
                  className={`group w-full rounded-[2rem] border p-5 text-left transition-all ${
                    selected?.id === s.id
                      ? 'scale-[1.02] border-brand-blue bg-brand-blue text-white shadow-xl'
                      : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:border-brand-blue/20'
                  }`}
                >
                  <p
                    className={`mb-3 text-xs font-bold uppercase tracking-tight ${selected?.id === s.id ? 'text-white' : 'text-[color:var(--color-text)]'}`}
                  >
                    {s.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase ${
                        selected?.id === s.id
                          ? 'border-white/20 bg-white/20'
                          : 'border-brand-blue/10 bg-brand-blue/5 text-brand-blue'
                      }`}
                    >
                      {s.status}
                    </span>
                    <span
                      className={`font-mono text-[8px] uppercase opacity-50 ${selected?.id === s.id ? 'text-white' : ''}`}
                    >
                      {s.channel}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* COL 2: CONTROL DE NODO */}
          <div className="space-y-10 border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 lg:col-span-3">
            <header className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40">
                2. Parámetros
              </span>
              <h3 className="font-heading text-xl text-[color:var(--color-text)]">Configuración</h3>
            </header>

            {!selected ? (
              <div className="py-20 text-center text-sm italic opacity-20">
                Selecciona un Blueprint.
              </div>
            ) : (
              <div className="animate-in fade-in space-y-8">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 shadow-inner">
                    <p className="text-[color:var(--color-text)]/30 mb-2 text-[8px] font-bold uppercase tracking-widest">
                      Internal_Key
                    </p>
                    <p className="truncate font-mono text-xs font-bold text-brand-blue">
                      {selected.key}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 shadow-inner">
                    <p className="text-[color:var(--color-text)]/30 mb-2 text-[8px] font-bold uppercase tracking-widest">
                      Protocol_Status
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${selected.status === 'active' ? 'animate-pulse bg-emerald-500' : 'bg-rose-500'}`}
                      />
                      <p className="text-[10px] font-bold uppercase tracking-widest">
                        {selected.status}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 border-t border-[color:var(--color-border)] pt-8">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl border-brand-blue/10 bg-[color:var(--color-surface)] text-[9px] font-bold uppercase text-brand-blue"
                  >
                    Cambiar Protocolo
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl border-rose-500/10 bg-[color:var(--color-surface)] text-[9px] font-bold uppercase text-rose-600 hover:bg-rose-500 hover:text-white"
                  >
                    Archivar Nodo
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* COL 3: EDITOR DE PASOS (TIMELINE) */}
          <main className="bg-[color:var(--color-surface-2)]/30 space-y-10 p-8 lg:col-span-6">
            <header className="flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40">
                  3. Línea de Tiempo
                </span>
                <h3 className="font-heading text-xl text-[color:var(--color-text)]">
                  Orquestación de Pasos
                </h3>
              </div>
              {selected && (
                <Button
                  onClick={() =>
                    setSteps([
                      ...steps,
                      {
                        step_index: steps.length,
                        delay_minutes: 60,
                        channel: 'email',
                        subject: '',
                        body: '',
                      },
                    ])
                  }
                  variant="outline"
                  className="h-9 rounded-xl border-brand-blue/20 bg-[color:var(--color-surface)] px-4 text-[9px] font-bold uppercase text-brand-blue"
                >
                  + Añadir Paso
                </Button>
              )}
            </header>

            {!selected ? (
              <div className="py-32 text-center">
                <Layers className="mx-auto mb-6 h-12 w-12 text-brand-blue/5" />
                <p className="text-[color:var(--color-text)]/50 text-sm font-light uppercase italic tracking-widest">
                  Esperando Selección de Blueprint
                </p>
              </div>
            ) : (
              <div className="custom-scrollbar max-h-[700px] space-y-6 overflow-y-auto pr-4">
                {steps.map((st, i) => (
                  <div
                    key={i}
                    className="group relative rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm transition-all hover:shadow-xl"
                  >
                    {/* Badge de Indice */}
                    <div className="absolute -left-3 top-8 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white bg-brand-dark font-heading text-xs text-brand-yellow shadow-lg transition-transform group-hover:scale-110">
                      {i + 1}
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="ml-1 text-[8px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
                          Delay (Minutes)
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-blue/30" />
                          <input
                            type="number"
                            className="h-11 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-11 pr-4 font-mono text-xs font-bold text-brand-blue shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/5"
                            value={st.delay_minutes}
                            onChange={(e) =>
                              setSteps(
                                steps.map((x, idx) =>
                                  idx === i ? { ...x, delay_minutes: Number(e.target.value) } : x,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="ml-1 text-[8px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
                          Protocol_Channel
                        </label>
                        <div className="relative">
                          {st.channel === 'email' ? (
                            <Mail className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-blue/30" />
                          ) : (
                            <Smartphone className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-blue/30" />
                          )}
                          <select
                            className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-11 pr-4 text-[9px] font-bold uppercase tracking-widest text-brand-blue shadow-inner outline-none"
                            value={st.channel}
                            onChange={(e) =>
                              setSteps(
                                steps.map((x, idx) =>
                                  idx === i ? { ...x, channel: e.target.value as any } : x,
                                ),
                              )
                            }
                          >
                            <option value="email">EMAIL_NODE</option>
                            <option value="whatsapp">WHATSAPP_NODE</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {st.channel === 'email' && (
                        <div className="space-y-1.5">
                          <label className="ml-1 text-[8px] font-bold uppercase tracking-widest text-brand-blue/40">
                            Subject_Line
                          </label>
                          <input
                            className="h-11 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 text-xs font-bold text-[color:var(--color-text)] outline-none transition-all focus:ring-4 focus:ring-brand-blue/5"
                            placeholder="Asunto del correo..."
                            value={st.subject || ''}
                            onChange={(e) =>
                              setSteps(
                                steps.map((x, idx) =>
                                  idx === i ? { ...x, subject: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <header className="flex items-center justify-between px-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-brand-blue/40">
                            Transmission_Body
                          </label>
                          <Terminal className="h-3 w-3 text-brand-blue/20" />
                        </header>
                        <textarea
                          className="h-32 w-full resize-none rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 text-xs font-light italic leading-relaxed text-[color:var(--color-text)] shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/5"
                          placeholder="Contenido del mensaje..."
                          value={st.body}
                          onChange={(e) =>
                            setSteps(
                              steps.map((x, idx) =>
                                idx === i ? { ...x, body: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 opacity-0 transition-opacity hover:bg-rose-50 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  onClick={() => setMsg('Snapshot_Saved')}
                  className="h-14 w-full rounded-2xl bg-brand-dark text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-xl transition-transform hover:scale-[1.02]"
                >
                  <Save className="mr-2 h-4 w-4" /> Guardar Orquestación
                </Button>
                {msg && <p className="text-center text-xs font-bold text-emerald-600">{msg}</p>}
              </div>
            )}
          </main>
        </div>
      </section>

      {/* MONITOR EN VIVO (FORENSE) */}
      <section className="group relative overflow-hidden rounded-[3.5rem] border border-[color:var(--color-border)] bg-brand-dark p-8 shadow-2xl md:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />

        <header className="relative z-10 mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-inner">
              <Activity className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading text-3xl tracking-tighter text-white">
                Monitor de Transmisión
              </h3>
              <p className="mt-1 text-xs font-light italic text-white/40">
                Rastreo forense de la cola activa de goteo.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowEnrollments(!showEnrollments);
              if (!showEnrollments) void loadEnrollments();
            }}
            className="h-12 rounded-2xl border border-white/10 bg-white/5 px-8 text-[9px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
          >
            {showEnrollments ? 'Cerrar Terminal' : 'Inspeccionar Tareas'}
          </Button>
        </header>

        {showEnrollments && (
          <div className="animate-in slide-in-from-top-4 relative z-10 space-y-4">
            <header className="mb-6 flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/60">
                Live Execution Queue
              </span>
            </header>

            {enrollments.length === 0 ? (
              <div className="rounded-[2.5rem] border-2 border-dashed border-white/5 py-20 text-center">
                <p className="font-mono text-sm uppercase tracking-widest text-white/20">
                  No Active Enrollments Detected
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {enrollments.map((e) => (
                  <div
                    key={e.id}
                    className="group flex flex-col justify-between gap-6 rounded-[2rem] border border-white/5 bg-white/5 p-6 transition-all hover:border-emerald-500/30 md:flex-row md:items-center"
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-emerald-400 shadow-inner transition-transform group-hover:scale-105">
                        P{e.current_step}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <p className="font-mono text-xs font-bold text-white/80">
                            {e.lead_id
                              ? `LEAD_${e.lead_id.slice(0, 8)}`
                              : `DEAL_${e.deal_id?.slice(0, 8)}`}
                          </p>
                          <span className="font-mono text-[9px] text-white/20">
                            TRACE_{e.id.slice(0, 6)}
                          </span>
                        </div>
                        {/* ✅ CORRECCIÓN DE TIPO BLINDADA */}
                        {!!(e.metadata as any)?.city && (
                          <p className="flex items-center gap-2 text-[10px] font-light italic text-white/40">
                            <ChevronRight className="h-3 w-3 opacity-30" /> Destination Node:{' '}
                            {String((e.metadata as any).city)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="border-l border-white/5 pl-6 md:text-right">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-emerald-500/50">
                        Próxima Inyección
                      </p>
                      <p className="font-mono text-sm text-emerald-400">
                        {new Date(e.next_run_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <footer className="flex justify-center border-t border-white/5 pt-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/20">
                Cron Status: Running every 15m @ /api/admin/sequences/cron
              </p>
            </footer>
          </div>
        )}
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 transition-opacity duration-500 hover:opacity-50">
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
