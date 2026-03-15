'use client';

import * as React from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { BookOpen, Tag, Plus, RefreshCw, Trash2, Power, Save, Layers, Activity } from 'lucide-react';

type Snip = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  enabled: boolean;
  updated_at: string;
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
  const [tags, setTags] = React.useState('faq,policy');

  async function load() {
    setError('');
    setHint('');
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/ai/playbook/snippets', { method: 'GET' });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(json?.error || 'No se pudo cargar el playbook.');
      setItems(Array.isArray(json?.items) ? (json.items as Snip[]) : []);
      if (json?.hint) setHint(String(json.hint));
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  async function create() {
    setError('');
    setHint('');
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/ai/playbook/snippets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, content, tags: parseTags(tags), enabled: true }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(json?.error || 'No se pudo crear el snippet.');
      setTitle('');
      setContent('');
      await load();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    setError('');
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/ai/playbook/snippets/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(json?.error || 'No se pudo actualizar.');
      await load();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este snippet?')) return;
    setError('');
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/ai/playbook/snippets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(json?.error || 'No se pudo eliminar.');
      await load();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  const playbookSignals = React.useMemo(() => [
    { label: 'Snippets Totales', value: String(items.length), note: 'Instrucciones en el cerebro de la IA.' },
    { label: 'Reglas Activas', value: String(items.filter(i => i.enabled).length), note: 'Directrices que la IA está usando.' }
  ], [items]);

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Cerebro AI (Playbook)</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Inyecta políticas, respuestas preaprobadas y tono de marca en la Inteligencia Artificial.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="AI Alignment"
        title="Entrena a tu Agente"
        description="Cada snippet (fragmento) que guardes aquí será leído por la IA antes de responder a un cliente. Úsalo para definir límites de reembolsos, cómo saludar o cuándo escalar a un humano."
        actions={[
          { href: '/admin/ai', label: 'Probar en AI Lab', tone: 'primary' },
          { href: '/admin/conversations', label: 'Ver Chats en Vivo' }
        ]}
        signals={playbookSignals}
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        
        {/* Editor de Snippets */}
        <section className="h-max rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-6">
            <Plus className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-xl text-[var(--color-text)]">Nuevo Snippet</h2>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Título de la Regla</span>
              <input
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-brand-blue transition-colors"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Política de reembolsos"
                disabled={loading}
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Instrucción para la IA</span>
              <textarea
                className="min-h-[160px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-light leading-relaxed outline-none focus:border-brand-blue transition-colors resize-y"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Indica exactamente cómo debe comportarse o qué datos debe dar..."
                disabled={loading}
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Etiquetas (Categorización)</span>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/30" />
                <input
                  className="w-full pl-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-mono outline-none focus:border-brand-blue transition-colors"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="faq, policy, pricing..."
                  disabled={loading}
                />
              </div>
            </label>

            <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
              <button onClick={create} disabled={loading || !title.trim() || content.trim().length < 10} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md disabled:opacity-50">
                <Save className="h-4 w-4"/> Guardar Regla
              </button>
            </div>
            
            {hint && <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700">{hint}</div>}
            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-700">{error}</div>}
          </div>
        </section>

        {/* Directorio de Snippets */}
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-[var(--color-border)] pb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-brand-blue" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Base de Conocimiento</h2>
            </div>
            <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Sync
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {items.length === 0 && !loading ? (
              <div className="py-12 text-center text-[var(--color-text)]/40 text-sm italic border border-dashed border-[var(--color-border)] rounded-2xl">
                La IA no tiene reglas personalizadas. Agrega la primera.
              </div>
            ) : null}

            {items.map((it) => (
              <div key={it.id} className={`rounded-2xl border p-5 transition-colors ${it.enabled ? 'border-[var(--color-border)] bg-[var(--color-surface-2)]' : 'border-rose-500/20 bg-rose-500/5'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${it.enabled ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <h3 className="font-semibold text-[var(--color-text)] text-base">{it.title}</h3>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {it.tags.map(t => <span key={t} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[9px] font-mono uppercase text-[var(--color-text)]/70">{t}</span>)}
                      <span className="text-[10px] font-mono text-[var(--color-text)]/30 ml-2 pt-0.5">Mod: {new Date(it.updated_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)]">
                    <button onClick={() => toggleEnabled(it.id, !it.enabled)} disabled={loading} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${it.enabled ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                      <Power className="h-3 w-3"/> {it.enabled ? 'Pausar' : 'Activar'}
                    </button>
                    <div className="w-px h-4 bg-[var(--color-border)]"></div>
                    <button onClick={() => remove(it.id)} disabled={loading} className="px-2 py-1.5 text-[var(--color-text)]/40 hover:text-rose-600 transition-colors">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm font-light leading-relaxed text-[var(--color-text)]/80 whitespace-pre-wrap shadow-inner">
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