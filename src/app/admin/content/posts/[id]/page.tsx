// src/app/admin/content/posts/[id]/page.tsx
'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_url: string | null;
  tags: string[];
  lang: Lang | string;
  status: Status | string;
  published_at: string | null;
  updated_at: string;
};

export default function AdminPostEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<PostRow | null>(null);

  const tagsStr = useMemo(() => (item?.tags ?? []).join(', '), [item?.tags]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await adminFetch(`/api/admin/content/posts/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo cargar');
        if (active) setItem(json.item as PostRow);
      } catch (err: any) {
        if (active) setError(err?.message ?? 'Error');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  function setField<K extends keyof PostRow>(key: K, value: PostRow[K]) {
    setItem((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save(patch?: Partial<PostRow>) {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const body = patch ?? {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        cover_url: item.cover_url,
        tags: item.tags,
        lang: item.lang as Lang,
        status: item.status as Status,
        content_md: item.content_md,
      };
      const res = await adminFetch(`/api/admin/content/posts/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok)
        throw new Error(json?.error?.message || json?.error || 'No se pudo guardar');
      setItem(json.item as PostRow);
    } catch (err: any) {
      setError(err?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm('¿Eliminar este post?')) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/content/posts/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo eliminar');
      router.push('/admin/content/posts');
    } catch (err: any) {
      setError(err?.message ?? 'Error');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="text-[color:var(--color-text)]/70 text-sm">Cargando…</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error ?? 'No encontrado'}
        </div>
        <button
          onClick={() => router.push('/admin/content/posts')}
          className="mt-4 text-sm underline underline-offset-4"
        >
          Volver
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-brand-blue">Editar post</h1>
          <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
            ID: {item.id} · Updated: {new Date(item.updated_at).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push('/admin/content/posts')}
            className="text-sm underline underline-offset-4"
          >
            Volver
          </button>
          <button
            onClick={() => save()}
            disabled={saving}
            className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={() =>
              save({ status: item.status === 'published' ? 'draft' : 'published' } as any)
            }
            disabled={saving}
            className="rounded-xl border border-black/15 bg-white/50 px-4 py-2 text-sm font-semibold text-black hover:bg-white/70 disabled:opacity-60"
          >
            {item.status === 'published' ? 'Pasar a draft' : 'Publicar'}
          </button>
          <button
            onClick={del}
            disabled={saving}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-500/15 disabled:opacity-60"
          >
            Eliminar
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm font-semibold">Título</div>
          <input
            value={item.title}
            onChange={(e) => setField('title', e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-semibold">Slug</div>
          <input
            value={item.slug}
            onChange={(e) => setField('slug', e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-semibold">Idioma</div>
          <select
            value={item.lang as any}
            onChange={(e) => setField('lang', e.target.value as any)}
            className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="de">DE</option>
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-sm font-semibold">Estado</div>
          <select
            value={item.status as any}
            onChange={(e) => setField('status', e.target.value as any)}
            className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>

        <label className="space-y-1 sm:col-span-2">
          <div className="text-sm font-semibold">Cover URL</div>
          <input
            value={item.cover_url ?? ''}
            onChange={(e) => setField('cover_url', e.target.value || null)}
            className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
            placeholder="https://..."
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <div className="text-sm font-semibold">Tags (coma)</div>
          <input
            value={tagsStr}
            onChange={(e) =>
              setField(
                'tags',
                e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean) as any,
              )
            }
            className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <div className="text-sm font-semibold">Excerpt</div>
          <textarea
            value={item.excerpt ?? ''}
            onChange={(e) => setField('excerpt', e.target.value || null)}
            className="min-h-[90px] w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <div className="text-sm font-semibold">Contenido (Markdown)</div>
          <textarea
            value={item.content_md ?? ''}
            onChange={(e) => setField('content_md', e.target.value)}
            className="min-h-[360px] w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 font-mono text-sm text-black"
          />
        </label>
      </div>
    </main>
  );
}
