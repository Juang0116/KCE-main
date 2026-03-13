// src/app/review-demo/page.tsx
import { redirect } from 'next/navigation';

import { ReviewForm } from '@/features/reviews/ReviewForm';
import { ReviewsList } from '@/features/reviews/ReviewsList';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Reseñas — Demo',
  description: 'Formulario de reseñas y listado de reseñas aprobadas (demo).',
  robots: { index: false, follow: false },
  alternates: { canonical: '/review-demo' }, // ✅ OK porque metadataBase está en layout
};

const DEMO_TOUR_SLUG = 'bogota-coffee-culture';

export default function ReviewDemoPage() {
  if (process.env.NODE_ENV === 'production') redirect('/');

  return (
    <main className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="font-heading text-2xl text-brand-blue">Demo de Reseñas</h1>
      <p className="text-[color:var(--color-text)]/70 text-sm">
        Envía una reseña. Quedará pendiente de aprobación. Luego, al aprobarla en Supabase, se
        mostrará abajo automáticamente.
      </p>

      <section aria-labelledby="form-title">
        <h2
          id="form-title"
          className="sr-only"
        >
          Enviar reseña
        </h2>
        <ReviewForm tourSlug={DEMO_TOUR_SLUG} />
      </section>

      <section aria-labelledby="list-title">
        <h2
          id="list-title"
          className="font-heading text-lg text-brand-blue"
        >
          Reseñas aprobadas
        </h2>
        <ReviewsList tourSlug={DEMO_TOUR_SLUG} />
      </section>
    </main>
  );
}
