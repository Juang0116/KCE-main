// src/app/admin/content/posts/page.tsx
import 'server-only';

import Link from 'next/link';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PostRow = {
  id: string;
  slug: string | null;
  title: string | null;
  status: 'draft' | 'published' | 'archived' | string;
  lang: string | null;
  published_at: string | null;
  updated_at: string | null;
};

export default async function AdminPostsList() {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('posts')
    .select('id,slug,title,status,lang,published_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(200);

  const items = ((data ?? []) as PostRow[]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-brand-blue">Posts</h1>
          <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
            Crear y publicar artículos del blog.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/content" className="text-sm underline underline-offset-4">
            Volver
          </Link>
          <Link
            href="/admin/content/posts/new"
            className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Nuevo post
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <div className="font-semibold">No se pudieron cargar los posts</div>
          <div className="mt-1 opacity-80">{error.message}</div>
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">
        <div className="grid grid-cols-12 bg-black/5 px-4 py-3 text-xs font-semibold text-[color:var(--color-text)]/70">
          <div className="col-span-6">Título</div>
          <div className="col-span-2">Lang</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2 text-right">Acción</div>
        </div>

        {items.length === 0 ? (
          <div className="p-4 text-sm text-[color:var(--color-text)]/70">No hay posts aún.</div>
        ) : (
          <div className="divide-y divide-black/10">
            {items.map((p) => (
              <div key={p.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-6">
                  <div className="font-semibold text-[color:var(--color-text)]">{p.title || 'Sin título'}</div>
                  <div className="text-xs text-[color:var(--color-text)]/60">{p.slug || '—'}</div>
                </div>

                <div className="col-span-2 text-xs text-[color:var(--color-text)]/70">
                  {(p.lang ?? '').toUpperCase()}
                </div>

                <div className="col-span-2">
                  <span
                    className={
                      p.status === 'published'
                        ? 'rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs text-emerald-700'
                        : 'rounded-full bg-amber-600/15 px-2 py-0.5 text-xs text-amber-700'
                    }
                  >
                    {p.status}
                  </span>
                </div>

                <div className="col-span-2 text-right">
                  <Link
                    href={`/admin/content/posts/${p.id}`}
                    className="text-sm underline underline-offset-4"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
