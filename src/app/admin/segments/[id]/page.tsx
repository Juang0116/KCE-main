import Link from 'next/link';

import { AdminSegmentDetailClient } from './segmentDetailClient';

export default function AdminSegmentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">
            Detalle de segmento
          </h1>
          <p className="text-[color:var(--color-text)]/70 mt-1 text-sm">
            Edita el filtro y ejecuta conteos.
          </p>
        </div>
        <Link
          href="/admin/segments"
          className="rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm font-medium hover:bg-white"
        >
          Volver
        </Link>
      </div>

      <div className="mt-6">
        <AdminSegmentDetailClient id={params.id} />
      </div>
    </div>
  );
}
