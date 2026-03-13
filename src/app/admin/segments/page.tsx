import Link from 'next/link';

import { AdminSegmentsClient } from './segmentsClient';

export default function AdminSegmentsPage() {
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">Segmentos</h1>
          <p className="text-[color:var(--color-text)]/70 mt-1 text-sm">
            Guardar filtros reutilizables en DB (admin-only) y ejecutar conteos rápidamente.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm font-medium hover:bg-white"
        >
          Volver
        </Link>
      </div>

      <AdminSegmentsClient />
    </main>
  );
}
