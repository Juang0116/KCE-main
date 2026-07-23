'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Save,
  FileText,
  Type,
  Hash,
  Globe,
  CheckCircle2,
  Sparkles,
  PenTool,
  Layout,
  AlertTriangle,
  CloudUpload,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

export default function AdminPostNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tags, setTags] = useState('');
  const [lang, setLang] = useState<Lang>('es');
  const [status, setStatus] = useState<Status>('draft');
  const [contentMd, setContentMd] = useState('');

  const tagsArray = useMemo(
    () =>
      tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tags],
  );

  async function onSubmit(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/content/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || undefined,
          excerpt: excerpt || null,
          cover_url: coverUrl || null,
          tags: tagsArray,
          lang,
          status,
          content_md: contentMd ?? '',
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok)
        throw new Error(json?.error?.message || json?.error || 'Falla al crear el registro');

      router.push(`/admin/content/posts/${json.item.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado en la base de datos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl px-4 pb-24 duration-700">
      {/* 01. HEADER DE CREACIÓN */}
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
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
              <PenTool className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
              Inicia una <span className="font-light italic text-brand-yellow">Historia</span>
            </h1>
          </div>
          <p className="max-w-xl text-base font-light text-muted">
            Define la arquitectura inicial del artículo. Podrás pulir la narrativa y los metadatos
            SEO en el editor avanzado una vez creado el nodo.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            onClick={onSubmit}
            disabled={loading || !title.trim()}
            className="h-14 rounded-full bg-brand-dark px-10 text-xs font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
          >
            {loading ? (
              <Sparkles className="mr-3 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-3 h-4 w-4" />
            )}
            {loading ? 'Inicializando...' : 'Crear y Continuar'}
          </Button>
        </div>
      </header>

      {error && (
        <div className="animate-in slide-in-from-top-2 mb-10 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 text-red-700 shadow-sm dark:bg-red-950/20 dark:text-red-400">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">
            Error de Inicialización: <span className="font-light">{error}</span>
          </p>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="grid items-start gap-10 lg:grid-cols-[1fr_400px]"
      >
        {/* 02. LADO IZQUIERDO: EL MANUSCRITO */}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="La esencia de Colombia..."
                  className="w-full border-none bg-transparent font-heading text-3xl tracking-tighter text-main outline-none placeholder:opacity-10 focus:ring-0 md:text-5xl"
                  disabled={loading}
                />
                <div className="h-px w-full bg-gradient-to-r from-brand-blue/30 via-brand-blue/10 to-transparent" />
              </div>

              {/* Markdown Editor */}
              <div className="space-y-5">
                <div className="ml-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-50">
                    <Type className="h-3.5 w-3.5 text-brand-blue/40" /> Primer Borrador (Markdown)
                  </label>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted opacity-40">
                    Protocolo: MD-UTF8
                  </span>
                </div>
                <div className="overflow-hidden rounded-[2.5rem] border border-brand-dark/10 shadow-2xl dark:border-white/5">
                  <textarea
                    value={contentMd}
                    onChange={(e) => setContentMd(e.target.value)}
                    placeholder="# Empieza con un encabezado impactante..."
                    className="custom-scrollbar min-h-[650px] w-full resize-none scroll-smooth bg-[#0F172A] p-10 font-mono text-sm leading-relaxed text-emerald-400/70 outline-none selection:bg-emerald-500/30 placeholder:text-emerald-900/50 md:p-16"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 03. LADO DERECHO: METADATOS TÁCTICOS (BÓVEDA) */}
        <aside className="space-y-8">
          <div className="sticky top-8 rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5">
            <header className="mb-8 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Layout className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl tracking-tight text-main">Arquitectura</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Configuración Inicial
                </p>
              </div>
            </header>

            <div className="space-y-6">
              {/* Mercado */}
              <div className="space-y-3">
                <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <Globe className="h-3 w-3" /> Mercado Objetivo
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-sm font-bold text-main shadow-sm outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  disabled={loading}
                >
                  <option value="es">Español (ES)</option>
                  <option value="en">English (EN)</option>
                  <option value="fr">Français (FR)</option>
                  <option value="de">Deutsch (DE)</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <CheckCircle2 className="h-3 w-3" /> Estado de Despliegue
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-sm font-bold text-main shadow-sm outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  disabled={loading}
                >
                  <option value="draft">Borrador (Seguro)</option>
                  <option value="published">Publicar Inmediato</option>
                </select>
              </div>

              {/* URL */}
              <div className="space-y-3">
                <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <Hash className="h-3 w-3" /> URL Permanente (Slug)
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="mejores-cafes-bogota"
                  className="h-12 w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 font-mono text-xs text-brand-blue shadow-inner outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  disabled={loading}
                />
              </div>

              {/* Cover */}
              <div className="space-y-3">
                <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <CloudUpload className="h-3 w-3" /> Portada (CDN URL)
                </label>
                <input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="h-12 w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-xs text-main shadow-inner outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  disabled={loading}
                />
                {coverUrl && (
                  <div className="mt-4 aspect-video overflow-hidden rounded-2xl border-2 border-brand-dark/5 opacity-60 shadow-soft">
                    <img
                      src={coverUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Etiquetas SEO
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="cultura, bogota, tips..."
                  className="h-12 w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-xs font-bold text-main shadow-inner outline-none dark:border-white/10"
                  disabled={loading}
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Meta-Descripción
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Breve resumen para Google..."
                  className="min-h-[120px] w-full resize-none rounded-2xl border border-brand-dark/10 bg-surface-2 p-4 text-xs font-light leading-relaxed text-main shadow-inner outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Consejo Editorial */}
          <div className="rounded-[var(--radius-2xl)] border border-brand-yellow/20 bg-brand-yellow/5 p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-main opacity-70">
              <CheckCircle2 className="h-4 w-4" /> Editorial Shield
            </div>
            <p className="text-main/80 text-[11px] font-light leading-relaxed">
              <strong className="font-bold">Knowing Cultures S.A.S.</strong> prioriza el contenido
              de valor. Asegúrate de que tu historia responda a una intención de búsqueda clara del
              viajero moderno.
            </p>
          </div>
        </aside>
      </form>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-20 flex flex-col items-center justify-between border-t border-brand-dark/10 pt-10 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Content Factory v3.2
        </div>
        <div className="mt-4 flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 opacity-50" /> Integrity-Lane:
            Secured
          </span>
          <span className="hidden opacity-30 sm:inline">|</span>
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-brand-yellow opacity-50" /> SEO-Engine: Standby
          </span>
        </div>
      </footer>
    </main>
  );
}
