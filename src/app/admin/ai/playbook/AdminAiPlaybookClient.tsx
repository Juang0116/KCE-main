/* src/app/admin/ai/playbook/AdminAiPlaybookClient.tsx */
'use client';

import * as React from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  BookOpen,
  Tag,
  Plus,
  RefreshCw,
  Trash2,
  Power,
  Save,
  Layers,
  Sparkles,
  FileText,
  CheckCircle2,
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
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
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

  React.useEffect(() => {
    load();
  }, [load]);

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
      const res = await adminFetch(`/api/admin/ai/playbook/snippets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar el snippet.');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  }

  const playbookSignals = React.useMemo(
    () => [
      {
        label: 'Snippets en Memoria',
        value: String(items.length),
        note: 'Conocimiento base.',
        icon: Layers,
      },
      {
        label: 'Alineación Activa',
        value: String(items.filter((i) => i.enabled).length),
        note: 'Reglas en ejecución.',
        icon: CheckCircle2,
      },
    ],
    [items],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 pb-24 duration-700">
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Sparkles className="h-3.5 w-3.5" /> Cognitive Infrastructure
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Playbook de IA
          </h1>
          <p className="mt-3 max-w-2xl text-base font-light text-muted">
            Define el comportamiento, las políticas de servicio y el tono de marca que tus Agentes
            de IA deben respetar rigurosamente en cada interacción.
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
          { href: '/admin/conversations', label: 'Auditar Chats' },
        ]}
        signals={playbookSignals}
      />

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* 03. EDITOR (BOVEDA IZQUIERDA) */}
        <section className="sticky top-8 h-max rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5">
          <div className="mb-8 flex items-center gap-3 border-b border-brand-dark/5 pb-6 dark:border-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-2xl tracking-tight text-main">
              Nueva Regla Cognitiva
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Título del Snippet
              </label>
              <input
                className="placeholder:text-muted/50 w-full rounded-2xl border border-brand-dark/10 bg-surface px-5 py-4 text-sm font-bold text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Saludo Institucional VIP"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Instrucción / Contenido Técnico
              </label>
              <textarea
                className="placeholder:text-muted/50 min-h-[200px] w-full resize-none rounded-2xl border border-brand-dark/10 bg-surface px-5 py-4 text-sm font-light leading-relaxed text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Indica: 'Debes saludar siempre mencionando que somos expertos en experiencias inmersivas en Colombia...'"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Categorías (Separadas por coma)
              </label>
              <div className="group relative">
                <Tag className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted opacity-50 transition-colors group-focus-within:text-brand-blue group-focus-within:opacity-100" />
                <input
                  className="placeholder:text-muted/50 w-full rounded-2xl border border-brand-dark/10 bg-surface px-5 py-4 pl-12 font-mono text-xs text-brand-blue outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
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
              className="group flex h-14 w-full items-center justify-center rounded-full bg-brand-blue text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-brand-dark disabled:opacity-50"
            >
              <Save className="mr-3 h-4 w-4 transition-transform group-hover:scale-110" />
              Inyectar en Memoria Base
            </Button>

            {hint && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-50 p-4 text-xs italic leading-relaxed text-amber-700 shadow-sm dark:bg-amber-500/10 dark:text-amber-400">
                {hint}
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* 04. DIRECTORIO (BOVEDA DERECHA) */}
        <section className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
          <div className="bg-surface-2/30 flex shrink-0 items-center justify-between border-b border-brand-dark/5 p-8 pb-6 dark:border-white/5">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-brand-blue opacity-50" />
              <h2 className="font-heading text-2xl tracking-tight text-main">
                Base de Conocimiento Actual
              </h2>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={load}
              disabled={loading}
              className="h-10 w-10 shrink-0 rounded-full border-brand-dark/10 text-muted shadow-sm transition-all hover:text-brand-blue"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="custom-scrollbar bg-surface-2/10 flex-1 space-y-6 overflow-y-auto p-6">
            {items.length === 0 && !loading ? (
              <div className="rounded-[var(--radius-3xl)] border-2 border-dashed border-brand-dark/10 bg-surface py-24 text-center dark:border-white/10">
                <FileText className="mx-auto mb-6 h-16 w-16 text-brand-blue opacity-30" />
                <h3 className="mb-2 font-heading text-xl tracking-tight text-main">
                  Sin reglas configuradas
                </h3>
                <p className="mx-auto max-w-sm text-sm font-light italic text-muted">
                  Utiliza el panel izquierdo para crear tu primera regla cognitiva y alinear a tus
                  Agentes.
                </p>
              </div>
            ) : null}

            {items.map((it) => (
              <div
                key={it.id}
                className={`group relative rounded-[var(--radius-2xl)] border p-8 transition-all duration-300 hover:shadow-pop ${it.enabled ? 'border-brand-dark/5 bg-surface dark:border-white/5' : 'border-rose-500/20 bg-rose-50 opacity-80 hover:opacity-100 dark:bg-rose-950/20'}`}
              >
                <header className="mb-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full shadow-sm ${it.enabled ? 'bg-green-500 shadow-green-500/50' : 'bg-rose-500 shadow-rose-500/50'}`}
                      />
                      <h3 className="font-heading text-xl text-main transition-colors group-hover:text-brand-blue">
                        {it.title}
                      </h3>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {it.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md border border-brand-blue/20 bg-brand-blue/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-blue"
                        >
                          {t}
                        </span>
                      ))}
                      <span className="ml-2 font-mono text-[10px] text-muted">
                        ID: {it.id.slice(0, 8)} • Modificado:{' '}
                        {new Date(it.updated_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 rounded-xl border border-brand-dark/5 bg-surface-2 p-1.5 opacity-0 shadow-inner transition-opacity group-hover:opacity-100 dark:border-white/5">
                    <button
                      onClick={() => toggleEnabled(it.id, !it.enabled)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${it.enabled ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10' : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10'}`}
                    >
                      <Power className="h-3.5 w-3.5" />{' '}
                      {it.enabled ? 'Pausar Regla' : 'Activar Regla'}
                    </button>
                    <div className="h-5 w-px bg-brand-dark/10 dark:bg-white/10" />
                    <button
                      onClick={() => remove(it.id)}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </header>

                <div className="bg-surface-2/50 whitespace-pre-wrap rounded-2xl border border-brand-dark/5 p-6 text-sm font-light leading-relaxed text-muted shadow-inner transition-colors group-hover:text-main dark:border-white/5">
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
