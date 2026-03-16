'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Save, Trash2, Globe, CheckCircle2, Image as ImageIcon, Hash, Youtube, FileText, Video } from 'lucide-react';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

type VideoRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  youtube_url: string;
  cover_url: string | null;
  tags: string[];
  lang: Lang | string;
  status: Status | string;
  published_at: string | null;
  updated_at: string;
};

export default function AdminVideoEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<VideoRow | null>(null);

  const tagsStr = useMemo(() => (item?.tags ?? []).join(', '), [item?.tags]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await adminFetch(`/api/admin/content/videos/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo cargar');
        if (active) setItem(json.item as VideoRow);
      } catch (err: any) {
        if (active) setError(err?.message ?? 'Error');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id]);

  function setField<K extends keyof VideoRow>(key: K, value: VideoRow[K]) {
    setItem((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save(patch?: Partial<VideoRow>) {
    if (!item) return;
    setSaving(true); setError(null);
    try {
      const body = patch ?? {
        title: item.title, slug: item.slug, description: item.description,
        youtube_url: item.youtube_url, cover_url: item.cover_url,
        tags: item.tags, lang: item.lang as Lang, status: item.status as Status,
      };
      const res = await adminFetch(`/api/admin/content/videos/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message || json?.error || 'No se pudo guardar');
      setItem(json.item as VideoRow);
    } catch (err: any) { setError(err?.message ?? 'Error'); } finally { setSaving(false); }
  }

  async function del() {
    if (!confirm('¿Eliminar definitivamente este video?')) return;
    setSaving(true); setError(null);
    try {
      const res = await adminFetch(`/api/admin/content/videos/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo eliminar');
      router.push('/admin/content/videos');
    } catch (err: any) { setError(err?.message ?? 'Error'); setSaving(false); }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <Video className="h-10 w-10 mx-auto text-[var(--color-text)]/20 mb-4 animate-pulse"/>
        <div className="text-[var(--color-text)]/50 text-sm font-bold uppercase tracking-widest">Cargando video...</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-700 text-center">
          {error ?? 'Video no encontrado'}
        </div>
        <button onClick={() => router.push('/admin/content/videos')} className="mt-6 flex items-center justify-center mx-auto text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 hover:text-brand-blue transition-colors">
          <ArrowLeft className="h-3 w-3 mr-1"/> Volver
        </button>
      </main>
    );
  }

  const isPub = item.status === 'published';

  return (
    <main className="space-y-10 pb-20 max-w-6xl mx-auto">
      
      {/* Cabecera */}
      <div>
        <button type="button" onClick={() => router.push('/admin/content/videos')} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-rose-600 transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Volver al Vlog
        </button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-[var(--color-text)] leading-tight">{item.title || 'Sin Título'}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--color-text)]/50">
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest font-sans ${isPub ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-[var(--color-surface-2)] text-[var(--color-text)]/60 border-[var(--color-border)]'}`}>
                {item.status}
              </span>
              <span>ID: {item.id.slice(0,8)}</span>
              <span>Actualizado: {new Date(item.updated_at).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => save()} disabled={saving} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-dark px-5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md disabled:opacity-50">
              <Save className="h-3 w-3" /> {saving ? '...' : 'Guardar'}
            </button>
            <button onClick={() => save({ status: isPub ? 'draft' : 'published' } as any)} disabled={saving} className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-5 text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-50 ${isPub ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface)]' : 'bg-emerald-500 text-white border-emerald-500 shadow-md hover:bg-emerald-600'}`}>
              {isPub ? 'Pasar a Draft' : 'Publicar Ya'}
            </button>
            <button onClick={del} disabled={saving} className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50" title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_350px] items-start">
        
        {/* Editor Principal (Columna Izquierda) */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2 border-b border-[var(--color-border)] pb-4">
              <Youtube className="h-5 w-5 text-rose-600" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Detalles del Video</h2>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Título del Video</span>
              <input value={item.title} onChange={(e) => setField('title', e.target.value)} required placeholder="Ej: 10 Cosas que hacer en Bogotá" className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 text-lg font-heading outline-none focus:border-rose-500 transition-colors disabled:opacity-50" disabled={saving} />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">YouTube URL</span>
              <input value={item.youtube_url} onChange={(e) => setField('youtube_url', e.target.value)} required placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3 text-sm font-mono text-brand-blue outline-none focus:border-rose-500 transition-colors disabled:opacity-50" disabled={saving} />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Descripción Corta</span>
              <textarea value={item.description ?? ''} onChange={(e) => setField('description', e.target.value || null)} placeholder="Escribe un pequeño resumen del video..." className="min-h-[200px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 font-light text-sm leading-relaxed outline-none focus:border-rose-500 transition-colors resize-y disabled:opacity-50" disabled={saving} />
            </label>
          </div>
        </div>

        {/* Metadatos (Columna Derecha) */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm space-y-5 sticky top-6">
            <div className="flex items-center gap-3 mb-2 border-b border-[var(--color-border)] pb-4">
              <FileText className="h-5 w-5 text-rose-600" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Metadatos & SEO</h2>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><Globe className="h-3 w-3"/> Idioma</span>
              <select value={item.lang as any} onChange={(e) => setField('lang', e.target.value as any)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer" disabled={saving}>
                <option value="es">Español (ES)</option>
                <option value="en">English (EN)</option>
                <option value="fr">Français (FR)</option>
                <option value="de">Deutsch (DE)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3"/> Estado Interno</span>
              <select value={item.status as any} onChange={(e) => setField('status', e.target.value as any)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer" disabled={saving}>
                <option value="draft">Borrador (Draft)</option>
                <option value="published">Publicado (Published)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Slug (URL)</span>
              <input value={item.slug} onChange={(e) => setField('slug', e.target.value)} placeholder="se-genera-automatico" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-mono outline-none focus:border-rose-500 transition-colors" disabled={saving} />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><ImageIcon className="h-3 w-3"/> Imagen de Portada (Opcional)</span>
              <input value={item.cover_url ?? ''} onChange={(e) => setField('cover_url', e.target.value || null)} placeholder="https://..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-rose-500 transition-colors" disabled={saving} />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><Hash className="h-3 w-3"/> Etiquetas (SEO)</span>
              <input value={tagsStr} onChange={(e) => setField('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean) as any) } placeholder="colombia, travel, vlog..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-rose-500 transition-colors" disabled={saving} />
              <p className="mt-1.5 text-[9px] uppercase tracking-widest text-[var(--color-text)]/40">Separa con comas.</p>
            </label>
          </div>
        </div>

      </div>
    </main>
  );
}