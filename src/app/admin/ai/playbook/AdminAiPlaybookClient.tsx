'use client';

import * as React from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  BookOpen, Tag, Plus, RefreshCw, Trash2, 
  Power, Save, Layers, Sparkles, 
  FileText, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Snip = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  enabled: boolean;
  updated_at: string;
};

// Tipado estricto para la respuesta de la API
type PlaybookResponse = {
  error?: string;
  hint?: string;
  items?: Snip[];
};

function parseTags(v: string): string[] {
  return v.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20);
}

export function AdminAiPlaybookClient() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [hint, setHint] = React.useState('');
  const [items, setItems] = React.useState<Snip[]>([]);

  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [tags, setTags] = React.useState(''); // UX: Iniciar vacío

  const load = React.useCallback(async () => {
    setError('');
    setHint('');
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/ai/playbook/snippets', { method: 'GET' });
      const json = (await res.json().catch(() => ({}))) as PlaybookResponse;
      
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar el playbook.');
      
      setItems(Array.isArray(json.items) ? json.items : []);
      if (json.hint) setHint(json.hint);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function create() {
    setError('');
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/ai/playbook/snippets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, content, tags: parseTags(tags), enabled: true }),
      });
      if (!res.ok) throw new Error('Error al crear el snippet.');
      
      // UX: Limpiar todo el formulario tras el éxito
      setTitle('');
      setContent('');
      setTags('');
      
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/ai/playbook/snippets/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar.');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al actualizar estado');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta instrucción permanentemente?')) return;
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/ai/playbook/snippets/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar el snippet.');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  }

  const playbookSignals = React.useMemo(() => [
    { label: 'Snippets en Memoria', value: String(items.length), note: 'Conocimiento base.', icon: Layers },
    { label: 'Alineación Activa', value: String(items.filter(i => i.enabled).length), note: 'Reglas en ejecución.', icon: CheckCircle2 }
  ], [items]);

  return (
    <div className="space-y-10 pb-24">
      
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/50">
            <Sparkles className="h-3 w-3" /> Cognitive Infrastructure
          </div>
          <h1 className="font-heading text-4xl text-brand-blue">Playbook de IA</h1>
          <p className="mt-2 text-sm text-[color:var(--color-text)]/60 font-light max-w-xl">
            Define el comportamiento, las políticas de servicio y el tono de marca que la IA debe respetar en cada interacción.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="System Prompt Alignment"
        title="Entrena el criterio de tu Agente"
        description="Los fragmentos activos se inyectan dinámicamente en el contexto de la IA. Úsalos para establecer reglas de negocio inamovibles o FAQ de alta prioridad."
        actions={[
          { href: '/admin/ai', label: 'Probar en Laboratorio', tone: 'primary' },
          { href: '/admin/conversations', label: 'Auditar Chats' }
        ]}
        signals={playbookSignals}
      />

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        
        {/* EDITOR (LA BOVEDA DE ENTRADA) */}
        <section className="h-max rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-xl sticky top-24">
          <div className="flex items-center gap-3 mb-8 border-b border-[color:var(--color-border)] pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-2xl text-brand-blue">Nueva Regla</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Título del Snippet</label>
              <input
                className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-4 text-sm font-bold text-brand-blue outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Saludo Institucional"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Contenido Técnico / Instrucción</label>
              <textarea
                className="min-h-[200px] w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-4 text-sm font-light leading-relaxed outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Indica: 'Debes saludar siempre mencionando que somos expertos en Colombia...'"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Categorías (Separadas por coma)</label>
              <div className="relative group">
                <Tag className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                <input
                  className="w-full pl-12 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-4 text-xs font-mono text-brand-blue outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Ej: faq, ventas, tono"
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              onClick={create} 
              disabled={loading || !title.trim() || content.trim().length < 10} 
              className="w-full rounded-2xl py-7 shadow-lg group"
            >
              <Save className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" /> Guardar en Cerebro
            </Button>
            
            {hint && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-[11px] text-amber-700 leading-relaxed italic">{hint}</div>}
            {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-[11px] text-red-700 font-bold">{error}</div>}
          </div>
        </section>

        {/* DIRECTORIO (CONOCIMIENTO EXPUESTO) */}
        <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden">
          <div className="p-8 pb-4 flex items-center justify-between border-b border-[color:var(--color-border)] mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-brand-blue/40" />
              <h2 className="font-heading text-2xl text-brand-blue">Base de Conocimiento Actual</h2>
            </div>
            <button onClick={load} disabled={loading} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/5 text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-sm disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="px-6 pb-8 space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {items.length === 0 && !loading ? (
              <div className="py-20 text-center rounded-[2.5rem] border-2 border-dashed border-[color:var(--color-border)]">
                <FileText className="mx-auto h-12 w-12 text-brand-blue/10 mb-4" />
                <p className="text-lg font-light text-[color:var(--color-text)]/30 italic">Sin reglas configuradas. Inicia la alineación.</p>
              </div>
            ) : null}

            {items.map((it) => (
              <div key={it.id} className={`group relative rounded-[2.5rem] border p-8 transition-all hover:shadow-xl ${it.enabled ? 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]' : 'border-rose-500/10 bg-rose-500/[0.02] opacity-80'}`}>
                
                <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-2.5 w-2.5 rounded-full shadow-sm ${it.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <h3 className="font-heading text-xl text-brand-blue group-hover:text-brand-yellow transition-colors">{it.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {it.tags.map(t => (
                        <span key={t} className="rounded-lg border border-brand-blue/10 bg-brand-blue/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-blue">
                          {t}
                        </span>
                      ))}
                      <span className="text-[10px] font-mono text-[color:var(--color-text)]/30 self-center ml-2">
                        ID: {it.id.slice(0,8)} • {new Date(it.updated_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 bg-[color:var(--color-surface-2)] p-1.5 rounded-2xl border border-[color:var(--color-border)] shadow-inner opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleEnabled(it.id, !it.enabled)} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${it.enabled ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      <Power className="h-3 w-3"/> {it.enabled ? 'Pausar' : 'Activar'}
                    </button>
                    <div className="w-px h-5 bg-[color:var(--color-border)]" />
                    <button onClick={() => remove(it.id)} className="p-2 text-[color:var(--color-text)]/30 hover:text-rose-600 transition-colors">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>
                </header>

                <div className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6 text-sm font-light leading-relaxed text-[color:var(--color-text)]/70 whitespace-pre-wrap shadow-inner group-hover:text-[color:var(--color-text)] transition-colors">
                  {it.content}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}