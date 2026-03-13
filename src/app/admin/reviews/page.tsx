// src/app/admin/reviews/page.tsx
import 'server-only';

import { AdminReviewsClient } from './AdminReviewsClient';

import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Reseñas | KCE',
  robots: { index: false, follow: false },
};

export default function AdminReviewsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-2xl text-brand-blue">Moderación de reseñas</h1>
      <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
        Aprobar o rechazar reseñas pendientes. Ruta protegida con Basic Auth.
      </p>

      <div className="mt-8">
        <AdminReviewsClient />
      </div>
    </main>
  );
}
