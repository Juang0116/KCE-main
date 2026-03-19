import 'server-only';
import { redirect } from 'next/navigation';
// Cambiamos 'import { Metadata }' por 'import type { Metadata }'
import type { Metadata } from 'next';

import { ReviewForm } from '@/features/reviews/ReviewForm';
import { ReviewsList } from '@/features/reviews/ReviewsList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Review System Demo | KCE',
  description: 'Entorno de pruebas para el sistema de feedback y curaduría de reseñas.',
  robots: { index: false, follow: false },
};

const DEMO_TOUR_SLUG = 'bogota-coffee-culture';

export default function ReviewDemoPage() {
  const isProd = process.env.NODE_ENV === 'production';
  const allowDemo = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

  if (isProd && !allowDemo) {
    redirect('/');
  }

  return (
    <main className="mx-auto max-w-[var(--container-max)] px-4 py-12 md:py-20">
      <div className="mx-auto max-w-2xl space-y-12">
        
        <header className="space-y-4 border-b border-[var(--color-border)] pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-brand-blue">
            Internal Dev Environment
          </div>
          <h1 className="font-heading text-4xl text-brand-blue md:text-5xl">
            Review System <span className="text-[var(--color-text)]/30">Demo</span>
          </h1>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            Las reseñas enviadas aquí entran en estado <strong className="text-brand-blue">"pending"</strong>. 
            Deben ser aprobadas en Supabase para aparecer abajo.
          </p>
        </header>

        <section aria-labelledby="form-title" className="rounded-[2rem] border border-brand-blue/10 bg-[var(--color-surface)] p-6 shadow-soft md:p-10">
          <h2 id="form-title" className="mb-6 font-heading text-xl text-brand-blue">
            Deja tu reseña para: <span className="italic text-[var(--color-text-muted)]">{DEMO_TOUR_SLUG}</span>
          </h2>
          <ReviewForm tourSlug={DEMO_TOUR_SLUG} />
        </section>

        <section aria-labelledby="list-title" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 id="list-title" className="font-heading text-2xl text-brand-blue">
              Reseñas aprobadas
            </h2>
            <div className="h-px flex-1 bg-[var(--color-border)] ml-6 hidden md:block" />
          </div>
          
          <div className="min-h-[200px] rounded-[2rem] border border-dashed border-[var(--color-border)] p-8">
            <ReviewsList tourSlug={DEMO_TOUR_SLUG} />
          </div>
        </section>

        <footer className="rounded-2xl bg-slate-50 p-4 text-[10px] text-slate-400 uppercase tracking-widest text-center">
          Target Slug: {DEMO_TOUR_SLUG} | Database: Supabase Production
        </footer>
      </div>
    </main>
  );
}