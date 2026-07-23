// src/features/reviews/SocialProofStrip.tsx
import Link from 'next/link';

import BlockTracker from '@/components/analytics/BlockTracker';

type Props = {
  page: string;
  locale?: 'es' | 'en' | 'fr' | 'de';
  title?: string;
};

export default function SocialProofStrip({
  page,
  title = 'Lo que dicen nuestros viajeros',
}: Props) {
  return (
    <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      <BlockTracker
        page={page}
        block="social_proof_strip"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-[color:var(--color-text)]/70 text-sm">
            Experiencias reales. Reseñas verificadas. Calidad consistente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[color:var(--color-text)]/80 rounded-xl bg-[color:var(--color-surface-2)] px-3 py-1 text-sm">
            ⭐ 4.8/5 promedio
          </span>
          <span className="text-[color:var(--color-text)]/80 rounded-xl bg-[color:var(--color-surface-2)] px-3 py-1 text-sm">
            ✅ Guías locales
          </span>
          <span className="text-[color:var(--color-text)]/80 rounded-xl bg-[color:var(--color-surface-2)] px-3 py-1 text-sm">
            🛡️ Compra protegida
          </span>
          <Link
            href="/tours"
            className="text-[color:var(--color-text)]/80 rounded-xl border border-[color:var(--color-border)] px-3 py-1 text-sm hover:bg-[color:var(--color-surface-2)]"
          >
            Ver tours
          </Link>
        </div>
      </div>
    </section>
  );
}
