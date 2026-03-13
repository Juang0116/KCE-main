/* src/app/admin/ai/playbook/AdminAiPlaybookClient.tsx */
'use client';

import * as React from 'react';

import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';

type Snip = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  enabled: boolean;
  updated_at: string;
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40">
        <h2 className="text-sm font-semibold">Nuevo snippet</h2>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Título</span>
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Política de reembolsos"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Contenido (respuesta aprobada)</span>
            <textarea
              className="min-h-[120px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe la respuesta que quieres que la IA use de forma consistente..."
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Tags (coma)</span>
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="faq,policy,pricing"
            />
          </label>

          <div className="flex items-center gap-2">
            <Button type="button" isLoading={loading} onClick={create} disabled={!title.trim() || content.trim().length < 20}>
              Crear
            </Button>
            <Button type="button" variant="secondary" onClick={load} isLoading={loading}>
              Recargar
            </Button>
          </div>

          {hint ? <div className="text-xs text-amber-700 dark:text-amber-300">{hint}</div> : null}
          {error ? <div className="text-xs text-red-600 dark:text-red-300">{error}</div> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Snippets</h2>
          <div className="text-xs text-[color:var(--color-text)]/60">{items.length} items</div>
        </div>

        <div className="mt-3 grid gap-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-black">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-[220px] flex-1">
                  <div className="text-sm font-semibold">{it.title}</div>
                  <div className="mt-1 text-xs text-[color:var(--color-text)]/60">
                    {it.tags?.length ? it.tags.join(', ') : '—'} · {new Date(it.updated_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={[
                      'rounded-xl px-3 py-1 text-xs',
                      it.enabled
                        ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-black/10 text-[color:var(--color-text)]/70',
                    ].join(' ')}
                    onClick={() => toggleEnabled(it.id, !it.enabled)}
                    disabled={loading}
                    type="button"
                  >
                    {it.enabled ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    className="rounded-xl bg-red-600/10 px-3 py-1 text-xs text-red-700 hover:bg-red-600/15 dark:text-red-300"
                    onClick={() => remove(it.id)}
                    disabled={loading}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--color-text)]/80">
                {it.content}
              </div>
            </div>
          ))}

          {!items.length ? (
            <div className="rounded-2xl border border-dashed border-black/15 p-6 text-center text-sm text-[color:var(--color-text)]/60 dark:border-white/15">
              Aún no hay snippets. Crea los primeros (FAQ, políticas, tono, reglas de escalamiento).
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
