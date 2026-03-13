// src/app/admin/content/videos/new/page.tsx
'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

export default function AdminVideoNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tags, setTags] = useState('');
  const [lang, setLang] = useState<Lang>('es');
  const [status, setStatus] = useState<Status>('draft');

  const tagsArray = useMemo(
    () =>
      tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tags],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/content/videos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || undefined,
          description: description || null,
          youtube_url: youtubeUrl,
          cover_url: coverUrl || null,
          tags: tagsArray,
          lang,
          status,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error?.message || json?.error || 'No se pudo crear el video');
      }

      router.push(`/admin/content/videos/${json.item.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-brand-blue">Nuevo video</h1>
          <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
            Registra un link de YouTube y publícalo cuando esté listo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/admin/content/videos')}
          className="text-sm underline underline-offset-4"
        >
          Volver
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-6"
      >
        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-semibold">Título</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
              required
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Slug (opcional)</div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
              placeholder="se-generará-del-título"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-semibold">Idioma</div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
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
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>

          <label className="space-y-1 sm:col-span-2">
            <div className="text-sm font-semibold">YouTube URL</div>
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <div className="text-sm font-semibold">Cover URL (opcional)</div>
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
              placeholder="https://..."
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <div className="text-sm font-semibold">Tags (coma)</div>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
              placeholder="cartagena, food, culture"
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <div className="text-sm font-semibold">Descripción</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm text-black"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Creando…' : 'Crear video'}
        </button>
      </form>
    </main>
  );
}
