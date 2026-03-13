// src/app/admin/content/page.tsx
import 'server-only';

import Link from 'next/link';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contenido | Admin | KCE',
  robots: { index: false, follow: false },
};

async function getCounts() {
  const admin = getSupabaseAdmin();

  const [postsDraft, postsPub, videosDraft, videosPub] = await Promise.all([
    admin.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('videos').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('videos').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ]);

  return {
    postsDraft: postsDraft.count ?? 0,
    postsPub: postsPub.count ?? 0,
    videosDraft: videosDraft.count ?? 0,
    videosPub: videosPub.count ?? 0,
  };
}

export default async function AdminContentHome() {
  const counts = await getCounts().catch(() => ({
    postsDraft: 0,
    postsPub: 0,
    videosDraft: 0,
    videosPub: 0,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-brand-blue">Contenido</h1>
          <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
            Blog y Vlog (YouTube) con estado Draft/Published.
          </p>
        </div>

        <Link
          href="/admin"
          className="text-sm underline underline-offset-4"
        >
          Volver a Admin
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/content/posts"
          className="rounded-2xl border border-black/10 bg-black/5 p-5 hover:bg-black/10"
        >
          <div className="font-semibold text-[color:var(--color-text)]">Posts</div>
          <div className="text-[color:var(--color-text)]/70 mt-1 text-sm">
            Draft: {counts.postsDraft} · Published: {counts.postsPub}
          </div>
        </Link>

        <Link
          href="/admin/content/videos"
          className="rounded-2xl border border-black/10 bg-black/5 p-5 hover:bg-black/10"
        >
          <div className="font-semibold text-[color:var(--color-text)]">Videos</div>
          <div className="text-[color:var(--color-text)]/70 mt-1 text-sm">
            Draft: {counts.videosDraft} · Published: {counts.videosPub}
          </div>
        </Link>
      </div>
    </main>
  );
}
