'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Network, Plus, RefreshCw, Settings, Target, Zap, Clock, Activity, Edit3, Trash2 } from 'lucide-react';

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

type SequencesListResponse = {
  items: (Sequence & { enrollments?: { active: number; completed: number; failed: number } })[];
};

type SequenceDetailResponse = {
  sequence: Sequence;
  steps: Array<{
    step_index: number;
    delay_minutes?: number | null;
    channel?: Step['channel'] | null;
    subject?: string | null;
    body?: string | null;
  }>;
};

export function AdminSequencesClient() {
  const [items, setItems] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [showEnrollments, setShowEnrollments] = useState(false);

  async function loadEnrollments() {
    try {
      const res = await adminFetch('/api/admin/sequences/enrollments?limit=50');
      if (!res.ok) return;
      const data = await res.json();
      setEnrollments(Array.isArray(data.items) ? data.items : []);
    } catch {}
  }

  async function refresh() {
    setLoading(true); setMsg(null);
    try {
      const res = await adminFetch('/api/admin/sequences');
      if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(t || `HTTP ${res.status}`); }
      const data = (await res.json()) as SequencesListResponse;
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) { setMsg(e?.message || 'Error'); } finally { setLoading(false); }
  }

  async function load(id: string) {
    setLoading(true); setMsg(null);
    try {
      const res = await adminFetch(`/api/admin/sequences/${id}`);
      if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(t || `HTTP ${res.status}`); }
      const data = (await res.json()) as SequenceDetailResponse;
      setSelected(data.sequence);
      const st = Array.isArray(data.steps) ? data.steps : [];
      setSteps(st.map((x) => ({ step_index: x.step_index, delay_minutes: x.delay_minutes ?? 0, channel: (x.channel ?? 'email') as Step['channel'], subject: x.subject ?? null, body: x.body ?? '' })));
    } catch (e: any) { setMsg(e?.message || 'Error'); } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  const canEdit = !!selected;

  const sequenceSignals = useMemo(() => [
    { label: 'Secuencias', value: String(items.length), note: 'Estructuras de follow-up activas o en draft.' },
    { label: 'Cola Activa', value: String(enrollments.length), note: 'Personas recorriendo una secuencia ahora mismo.' }
  ], [items.length, enrollments.length]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Automatización (Sequences)</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Drip campaigns y flujos de seguimiento automáticos por email y WhatsApp.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Growth Engine"
        title="Escala el seguimiento comercial"
        description="Crea pasos con retrasos específicos para nutrir leads o perseguir carritos abandonados. Vercel ejecuta la cola cada 15 minutos en segundo plano."
        actions={[
          { href: '/admin/outbound', label: 'Ver Bandeja de Salida', tone: 'primary' },
          { href: '/admin/marketing', label: 'Dashboard de Marketing' }
        ]}
        signals={sequenceSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="flex items-center gap-3">
            <Network className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Diseñador de Flujos</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} disabled={loading} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Sync
            </button>
            <button onClick={async () => {
              const key = prompt('Key de la secuencia (único, ej: checkout_followup):', 'checkout_followup');
              if (!key) return;
              const name = prompt('Nombre visible:', 'Checkout follow-up');
              if (!name) return;
              const res = await adminFetch('/api/admin/sequences', { method: 'POST', body: JSON.stringify({ key, name, status: 'draft', channel: 'mixed', locale: 'es' }) });
              if (!res.ok) { const t = await res.text().catch(() => ''); setMsg(t || `HTTP ${res.status}`); return; }
              await refresh();
            }} disabled={loading} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
              <Plus className="h-3 w-3" /> Nueva Secuencia
            </button>
          </div>
        </div>

        {msg && <div className="mb-6 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-sm font-medium text-brand-blue">{msg}</div>}

        {/* Layout 3 Columnas */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Col 1: Lista de Secuencias */}
          <div className="flex flex-col gap-3 lg:border-r border-[var(--color-border)] lg:pr-8">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-2"><Target className="h-4 w-4"/> 1. Selecciona</div>
            {items.length === 0 ? <div className="text-sm text-[var(--color-text)]/40 italic py-4">No hay secuencias creadas.</div> : null}
            {items.map((s) => (
              <button key={s.id} onClick={() => load(s.id)} className={`text-left rounded-2xl border p-4 transition-all ${selected?.id === s.id ? 'border-brand-blue bg-brand-blue/5 shadow-sm scale-[1.02]' : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-brand-blue/30'}`}>
                <div className={`font-semibold ${selected?.id === s.id ? 'text-brand-blue' : 'text-[var(--color-text)]'}`}>{s.name}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-widest">
                  <span className={`px-2 py-0.5 rounded-full border ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-[var(--color-surface)] text-[var(--color-text)]/50 border-[var(--color-border)]'}`}>{s.status}</span>
                  <span className="px-2 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]/50">{s.channel}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Col 2: Detalles de la Secuencia */}
          <div className="flex flex-col gap-4 lg:border-r border-[var(--color-border)] lg:pr-8">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-2"><Settings className="h-4 w-4"/> 2. Configura</div>
            {!selected ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text)]/40">Selecciona una secuencia en el panel izquierdo.</div>
            ) : (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
                <div className="space-y-4 text-sm mb-6">
                  <div><span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 block mb-1">ID</span><code className="bg-[var(--color-surface)] px-2 py-1 rounded-lg border border-[var(--color-border)] text-xs">{selected.id}</code></div>
                  <div><span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 block mb-1">Key</span><span className="font-semibold text-brand-blue">{selected.key}</span></div>
                  <div><span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 block mb-1">Estado Actual</span><span className="font-bold uppercase tracking-widest text-[10px]">{selected.status}</span></div>
                </div>
                <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
                  <button onClick={async () => {
                    const status = prompt('Estado (draft|active|paused|archived)', selected.status);
                    if (!status) return;
                    const res = await adminFetch('/api/admin/sequences', { method: 'POST', body: JSON.stringify({ id: selected.id, key: selected.key, name: selected.name, status }) });
                    if (!res.ok) { const t = await res.text().catch(() => ''); setMsg(t || `HTTP ${res.status}`); return; }
                    await refresh(); await load(selected.id);
                  }} className="w-full rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-sm">
                    Cambiar Estado
                  </button>
                  <button onClick={async () => {
                    if (!confirm('¿Seguro que quieres eliminar esta secuencia permanentemente?')) return;
                    const res = await adminFetch(`/api/admin/sequences/${selected.id}`, { method: 'DELETE' });
                    if (!res.ok) { const t = await res.text().catch(() => ''); setMsg(t || `HTTP ${res.status}`); return; }
                    setSelected(null); setSteps([]); await refresh();
                  }} className="w-full rounded-xl border border-rose-500/20 bg-rose-50 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-600 transition hover:bg-rose-100">
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Col 3: Pasos (Steps) */}
          <div className="flex flex-col gap-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-2"><Zap className="h-4 w-4"/> 3. Construye Pasos</div>
            {!canEdit ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text)]/40">Selecciona una secuencia.</div>
            ) : (
              <div className="space-y-4">
                {steps.map((st, i) => (
                  <div key={i} className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 pt-6 shadow-sm transition-colors hover:border-brand-blue/30">
                    <div className="absolute -left-3 -top-3 h-8 w-8 flex items-center justify-center rounded-full bg-brand-dark text-brand-yellow font-bold text-xs shadow-md border-2 border-white">
                      #{st.step_index}
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <label className="flex-1">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1">Delay (Minutos)</div>
                        <input type="number" min={0} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs outline-none focus:border-brand-blue" value={st.delay_minutes} onChange={(e) => { const v = Number(e.target.value); setSteps((prev) => prev.map((x, idx) => (idx === i ? { ...x, delay_minutes: v } : x))); }} />
                      </label>
                      <label className="flex-1">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1">Canal</div>
                        <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs outline-none focus:border-brand-blue appearance-none cursor-pointer uppercase" value={st.channel} onChange={(e) => { const v = e.target.value as any; setSteps((prev) => prev.map((x, idx) => (idx === i ? { ...x, channel: v } : x))); }}>
                          <option value="email">Email</option><option value="whatsapp">WhatsApp</option>
                        </select>
                      </label>
                      <button onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))} className="mt-4 flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shrink-0" title="Eliminar Paso">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>

                    {st.channel === 'email' && (
                      <input className="mb-3 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-brand-blue font-medium" placeholder="Asunto del Email" value={st.subject || ''} onChange={(e) => { const v = e.target.value; setSteps((prev) => prev.map((x, idx) => (idx === i ? { ...x, subject: v || null } : x))); }} />
                    )}
                    <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm outline-none focus:border-brand-blue min-h-[100px] resize-y font-light leading-relaxed" placeholder="Cuerpo del mensaje..." value={st.body} onChange={(e) => { const v = e.target.value; setSteps((prev) => prev.map((x, idx) => (idx === i ? { ...x, body: v } : x))); }} />
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setSteps((p) => [...p, { step_index: p.length, delay_minutes: p.length ? 60 : 0, channel: 'email', subject: '', body: '' }])} className="flex-1 rounded-xl border border-brand-blue/30 bg-brand-blue/5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-blue transition hover:bg-brand-blue/10">
                    + Añadir Paso
                  </button>
                  <button onClick={async () => {
                    if (!selected) return;
                    const res = await adminFetch(`/api/admin/sequences/${selected.id}`, { method: 'PUT', body: JSON.stringify({ steps }) });
                    if (!res.ok) { const t = await res.text().catch(() => ''); setMsg(t || `HTTP ${res.status}`); return; }
                    setMsg('Pasos Guardados ✅'); setTimeout(() => setMsg(null), 3000);
                  }} className="flex-1 rounded-xl bg-brand-dark px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-sm">
                    Guardar Flujo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monitor de Cola (Enrollments) */}
        <div className="mt-12 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-emerald-600" />
              <div>
                <h3 className="font-heading text-xl text-[var(--color-text)]">Monitor en Vivo</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mt-1">{enrollments.length} Tareas en Cola</p>
              </div>
            </div>
            <button onClick={() => { setShowEnrollments(!showEnrollments); if (!showEnrollments) void loadEnrollments(); }} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-black/5">
              {showEnrollments ? 'Ocultar Monitor' : 'Inspeccionar Cola'}
            </button>
          </div>

          {showEnrollments && (
            <div className="mt-6 space-y-3">
              {enrollments.length === 0 && <div className="text-center text-sm text-[var(--color-text)]/40 py-6 border border-dashed border-[var(--color-border)] rounded-2xl">La cola de ejecución está vacía en este momento.</div>}
              {enrollments.map((e) => (
                <div key={e.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 border border-emerald-500/20">Paso {e.current_step}</span>
                      <span className="text-[10px] font-mono text-[var(--color-text)]/40">ID: {e.id.slice(0,8)}</span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--color-text)]">
                      {e.lead_id ? `Lead: ${e.lead_id.slice(0, 8)}` : ''} {e.deal_id ? `Deal: ${e.deal_id.slice(0, 8)}` : ''}
                    </div>
                    {Boolean(e.metadata?.city) && <div className="text-xs text-[var(--color-text)]/60 mt-1">📍 {String(e.metadata.city)}</div>}
                  </div>
                  <div className="md:text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 flex items-center gap-1 md:justify-end">
                      <Clock className="h-3 w-3"/> Próxima Ejecución:
                    </div>
                    <div className="text-sm font-medium text-brand-blue mt-1">
                      {new Date(e.next_run_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    {e.last_error && <div className="mt-2 text-[10px] text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 w-max md:ml-auto max-w-[250px] truncate" title={e.last_error}>⚠ {e.last_error}</div>}
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-center text-[var(--color-text)]/40 mt-4 uppercase tracking-widest">El Cron de Vercel (<code>/api/admin/sequences/cron</code>) procesa esta cola cada 15 minutos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}