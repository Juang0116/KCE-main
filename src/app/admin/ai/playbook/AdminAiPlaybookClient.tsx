/* src/app/admin/ai/playbook/AdminAiPlaybookClient.tsx */
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
  const [tags, setTags] = React.useState('');

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
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Sparkles className="h-3.5 w-3.5" /> Cognitive Infrastructure
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">Playbook de IA</h1>
          <p className="mt-3 text-base text-muted font-light max-w-2xl">
            Define el comportamiento, las políticas de servicio y el tono de marca que tus Agentes de IA deben respetar rigurosamente en cada interacción.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH */}
      <AdminOperatorWorkbench
        eyebrow="System Prompt Alignment"
        title="Entrena el criterio de tu Agente"
        description="Los fragmentos (Snippets) activos se inyectan dinámicamente en el contexto de la IA. Úsalos para establecer reglas de negocio inamovibles o FAQ de alta prioridad."
        actions={[
          { href: '/admin/ai', label: 'Probar en Laboratorio', tone: 'primary' },
          { href: '/admin/conversations', label: 'Auditar Chats' }
        ]}
        signals={playbookSignals}
      />

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        
        {/* 03. EDITOR (BOVEDA IZQUIERDA) */}
        <section className="h-max rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop sticky top-8">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-dark/5 dark:border-white/5 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-2xl text-main tracking-tight">Nueva Regla Cognitiva</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Título del Snippet</label>
              <input
                className="w-full rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface px-5 py-4 text-sm font-bold text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-muted/50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Saludo Institucional VIP"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Instrucción / Contenido Técnico</label>
              <textarea
                className="min-h-[200px] w-full rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface px-5 py-4 text-sm font-light leading-relaxed text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all resize-none placeholder:text-muted/50"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Indica: 'Debes saludar siempre mencionando que somos expertos en experiencias inmersivas en Colombia...'"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Categorías (Separadas por coma)</label>
              <div className="relative group">
                <Tag className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted opacity-50 group-focus-within:text-brand-blue group-focus-within:opacity-100 transition-colors" />
                <input
                  className="w-full pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface px-5 py-4 text-xs font-mono text-brand-blue outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-muted/50"
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
              className="w-full rounded-full h-14 bg-brand-blue text-white hover:bg-brand-dark shadow-pop transition-all disabled:opacity-50 text-xs font-bold uppercase tracking-widest flex items-center justify-center group"
            >
              <Save className="mr-3 h-4 w-4 transition-transform group-hover:scale-110" /> 
              Inyectar en Memoria Base
            </Button>
            
            {hint && <div className="rounded-2xl border border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-400 leading-relaxed italic shadow-sm">{hint}</div>}
            {error && <div className="rounded-2xl border border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-400 font-bold shadow-sm">{error}</div>}
          </div>
        </section>

        {/* 04. DIRECTORIO (BOVEDA DERECHA) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-8 pb-6 flex items-center justify-between border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30 shrink-0">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-brand-blue opacity-50" />
              <h2 className="font-heading text-2xl text-main tracking-tight">Base de Conocimiento Actual</h2>
            </div>
            <Button variant="outline" size="icon" onClick={load} disabled={loading} className="rounded-full shadow-sm border-brand-dark/10 h-10 w-10 shrink-0 text-muted hover:text-brand-blue transition-all">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-surface-2/10">
            {items.length === 0 && !loading ? (
              <div className="py-24 text-center rounded-[var(--radius-3xl)] border-2 border-dashed border-brand-dark/10 dark:border-white/10 bg-surface">
                <FileText className="mx-auto h-16 w-16 text-brand-blue opacity-30 mb-6" />
                <h3 className="text-xl font-heading text-main tracking-tight mb-2">Sin reglas configuradas</h3>
                <p className="text-sm font-light text-muted italic max-w-sm mx-auto">Utiliza el panel izquierdo para crear tu primera regla cognitiva y alinear a tus Agentes.</p>
              </div>
            ) : null}

            {items.map((it) => (
              <div key={it.id} className={`group relative rounded-[var(--radius-2xl)] border p-8 transition-all duration-300 hover:shadow-pop ${it.enabled ? 'border-brand-dark/5 dark:border-white/5 bg-surface' : 'border-rose-500/20 bg-rose-50 dark:bg-rose-950/20 opacity-80 hover:opacity-100'}`}>
                
                <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-2.5 w-2.5 rounded-full shadow-sm ${it.enabled ? 'bg-green-500 shadow-green-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} />
                      <h3 className="font-heading text-xl text-main group-hover:text-brand-blue transition-colors">{it.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mt-3">
                      {it.tags.map(t => (
                        <span key={t} className="rounded-md border border-brand-blue/20 bg-brand-blue/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-blue">
                          {t}
                        </span>
                      ))}
                      <span className="text-[10px] font-mono text-muted ml-2">
                        ID: {it.id.slice(0,8)} • Modificado: {new Date(it.updated_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 bg-surface-2 p-1.5 rounded-xl border border-brand-dark/5 dark:border-white/5 shadow-inner opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleEnabled(it.id, !it.enabled)} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${it.enabled ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10'}`}
                    >
                      <Power className="h-3.5 w-3.5"/> {it.enabled ? 'Pausar Regla' : 'Activar Regla'}
                    </button>
                    <div className="w-px h-5 bg-brand-dark/10 dark:bg-white/10" />
                    <button onClick={() => remove(it.id)} className="p-2 text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>
                </header>

                <div className="rounded-2xl border border-brand-dark/5 dark:border-white/5 bg-surface-2/50 p-6 text-sm font-light leading-relaxed text-muted whitespace-pre-wrap shadow-inner group-hover:text-main transition-colors">
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