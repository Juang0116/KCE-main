'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  Trash2,
  Globe,
  CheckCircle2,
  Hash,
  Type,
  Sparkles,
  ExternalLink,
  Clock,
  AlertTriangle,
  Eye,
  CloudUpload,
  Layout,
  Terminal,
  ShieldCheck,
  FileText,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

export default function AdminPostEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<PostRow | null>(null);

  const tagsStr = useMemo(() => (item?.tags ?? []).join(', '), [item?.tags]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/content/posts/${id}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo cargar el artículo');
      setItem(json.item as PostRow);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error crítico al cargar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function setField<K extends keyof PostRow>(key: K, value: PostRow[K]) {
    setItem((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save(patch?: Partial<PostRow>) {
    if (!item || !id) return;
    setSaving(true);
    setError(null);
    try {
      const body = patch ?? {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        cover_url: item.cover_url,
        tags: item.tags,
        lang: item.lang,
        status: item.status,
        content_md: item.content_md,
      };
      const res = await adminFetch(`/api/admin/content/posts/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok)
        throw new Error(json?.error?.message || json?.error || 'Falla al guardar');
      setItem(json.item as PostRow);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de red');
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!id) return;
    if (!confirm('¿Eliminar definitivamente este artículo? Esta acción no se puede deshacer.'))
      return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/content/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      router.push('/admin/content/posts');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="animate-in fade-in mx-auto max-w-4xl px-6 py-40 text-center duration-1000">
        <div className="relative mb-8 inline-block">
          <Layout className="h-16 w-16 animate-pulse text-brand-blue opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-6 w-6 animate-bounce text-brand-blue" />
          </div>
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand-blue opacity-40">
          Sincronizando con el Núcleo...
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <AlertTriangle className="mx-auto mb-8 h-16 w-16 text-red-500 opacity-40" />
        <h2 className="mb-4 font-heading text-3xl tracking-tight text-main">
          {error ?? 'Artículo extraviado'}
        </h2>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/content/posts')}
          className="h-12 rounded-full px-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Gestión
        </Button>
      </main>
    );
  }

  const isPub = item.status === 'published';

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl px-4 pb-24 duration-700">
      {/* 01. HEADER DE LA FACTORÍA */}
      <header className="mb-12 flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push('/admin/content/posts')}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />{' '}
            Authority Engine / Blog
          </button>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
            {item.title || <span className="italic opacity-10">Borrador sin título</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                isPub
                  ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-brand-yellow'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${isPub ? 'animate-pulse bg-green-500' : 'bg-amber-500'}`}
              />
              {item.status}
            </span>
            <div className="h-1 w-1 rounded-full bg-brand-dark/10 dark:bg-white/10" />
            <span className="flex items-center gap-2 font-mono text-[10px] text-muted">
              <Clock className="h-3.5 w-3.5 opacity-40" /> Actualizado:{' '}
              {new Date(item.updated_at).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Button
            onClick={() => save()}
            disabled={saving}
            className="h-14 rounded-full bg-brand-dark px-10 text-xs font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
          >
            <Save className="mr-3 h-4 w-4" /> {saving ? 'Cifrando...' : 'Guardar Cambios'}
          </Button>

          <Button
            variant="outline"
            onClick={() => save({ status: isPub ? 'draft' : 'published' })}
            disabled={saving}
            className={`h-14 rounded-full border-brand-dark/10 px-8 text-xs font-bold uppercase tracking-widest transition-all ${isPub ? 'hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/10' : 'border-green-600 bg-green-600 text-white hover:bg-green-700'}`}
          >
            {isPub ? 'Mover a Draft' : 'Publicar'}
          </Button>

          <button
            onClick={del}
            disabled={saving}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/10 bg-red-50 text-red-600 shadow-sm transition-all hover:bg-red-600 hover:text-white disabled:opacity-20 dark:bg-red-500/10"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {error && (
        <div className="animate-in slide-in-from-top-2 mb-10 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 text-red-700 shadow-sm dark:bg-red-950/20 dark:text-red-400">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">
            Error de Sincronización: <span className="font-light">{error}</span>
          </p>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        {/* 02. EDITOR (BÓVEDA DE ESCRITURA) */}
        <section className="space-y-8">
          <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:p-12">
            <div className="pointer-events-none absolute right-0 top-0 p-10 opacity-[0.01]">
              <FileText className="h-64 w-64 text-brand-blue" />
            </div>

            <div className="relative z-10 space-y-10">
              {/* Título Input */}
              <div className="space-y-4">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-50">
                  Título Maestro (H1)
                </label>
                <input
                  value={item.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="La esencia de Colombia..."
                  className="w-full border-none bg-transparent font-heading text-4xl tracking-tighter text-main outline-none placeholder:opacity-10 focus:ring-0 md:text-5xl"
                />
                <div className="h-px w-full bg-gradient-to-r from-brand-blue/30 via-brand-blue/10 to-transparent" />
              </div>

              {/* Markdown Editor */}
              <div className="space-y-5">
                <div className="ml-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-50">
                    <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Manuscrito (Markdown)
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="rounded border border-green-500/10 bg-green-50 px-2 py-0.5 font-mono text-[9px] text-green-600 dark:bg-green-500/10 dark:text-green-400">
                      Active: Cloud-Sync
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden rounded-[2.5rem] border border-brand-dark/10 shadow-2xl dark:border-white/5">
                  <textarea
                    value={item.content_md}
                    onChange={(e) => setField('content_md', e.target.value)}
                    placeholder="Escribe tu historia..."
                    className="custom-scrollbar min-h-[800px] w-full resize-none scroll-smooth bg-[#0F172A] p-10 font-mono text-sm leading-relaxed text-emerald-400/80 outline-none selection:bg-emerald-500/30 md:p-16"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 03. METADATOS & SEO (BÓVEDA DE CONFIGURACIÓN) */}
        <aside className="space-y-8">
          <div className="sticky top-8 rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5">
            <header className="mb-8 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl tracking-tight text-main">SEO Core</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Configuración de Indexación
                </p>
              </div>
            </header>

            <div className="space-y-8">
              {/* Idioma */}
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Localización
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40" />
                  <select
                    value={item.lang}
                    onChange={(e) => setField('lang', e.target.value)}
                    className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-brand-dark/10 bg-surface-2 pl-11 pr-4 text-sm font-bold text-main shadow-sm outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  >
                    <option value="es">Español (ES)</option>
                    <option value="en">English (EN)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="de">Deutsch (DE)</option>
                  </select>
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  URL Permanente (Slug)
                </label>
                <div className="group relative">
                  <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
                  <input
                    value={item.slug}
                    onChange={(e) => setField('slug', e.target.value)}
                    className="h-12 w-full rounded-xl border border-brand-dark/10 bg-surface-2 pl-11 font-mono text-xs text-brand-blue shadow-inner outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  />
                </div>
              </div>

              {/* Cover URL */}
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Imagen de Portada
                </label>
                <div className="group relative">
                  <CloudUpload className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
                  <input
                    value={item.cover_url ?? ''}
                    onChange={(e) => setField('cover_url', e.target.value || null)}
                    placeholder="URL del CDN..."
                    className="h-12 w-full rounded-xl border border-brand-dark/10 bg-surface-2 pl-11 text-xs text-main shadow-inner outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  />
                </div>
                {item.cover_url && (
                  <div className="group/img relative mt-4 aspect-video overflow-hidden rounded-2xl border-2 border-brand-dark/5 shadow-soft">
                    <img
                      src={item.cover_url}
                      alt="Preview"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/20 opacity-0 transition-opacity group-hover/img:opacity-100">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Etiquetas Semánticas
                </label>
                <input
                  value={tagsStr}
                  onChange={(e) =>
                    setField(
                      'tags',
                      e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="bogota, cultura, lujo..."
                  className="h-12 w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-xs font-bold text-main shadow-inner outline-none dark:border-white/10"
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Meta-Descripción (Snippet)
                </label>
                <textarea
                  value={item.excerpt ?? ''}
                  onChange={(e) => setField('excerpt', e.target.value || null)}
                  className="min-h-[140px] w-full resize-none rounded-2xl border border-brand-dark/10 bg-surface-2 p-4 text-xs font-light leading-relaxed text-main shadow-inner outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                />
              </div>

              <div className="border-t border-brand-dark/5 pt-8 dark:border-white/5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="group h-12 w-full rounded-xl text-brand-blue hover:bg-brand-blue/5"
                >
                  <Eye className="mr-3 h-4 w-4" /> Previsualizar en Sitio{' '}
                  <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-0 transition-all group-hover:opacity-100" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-2xl)] border border-brand-blue/10 bg-brand-blue/5 p-8">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-brand-blue">
              <ShieldCheck className="h-4 w-4" /> Editorial Shield
            </p>
            <ul className="space-y-3 text-[11px] font-light leading-relaxed text-brand-blue/70">
              <li className="flex gap-2">
                • <span>Asegura que el título contenga la palabra clave principal.</span>
              </li>
              <li className="flex gap-2">
                • <span>Optimiza las imágenes para carga progresiva (WebP).</span>
              </li>
              <li className="flex gap-2">
                • <span>La meta-descripción influye directamente en el CTR.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-20 flex flex-col items-center justify-between border-t border-brand-dark/10 pt-10 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Content Engine v3.2
        </div>
        <div className="mt-4 flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 opacity-50" /> Editorial-Integrity:
            Active
          </span>
          <span className="hidden opacity-30 sm:inline">|</span>
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-brand-yellow opacity-50" /> RAG-Context: Ready
          </span>
        </div>
      </footer>
    </main>
  );
}
