import clsx from 'clsx';
import * as React from 'react';

// Analytics & Tracking
import PageViewListener from '@/components/analytics/PageViewListener';
import CtaClickListener from '@/components/analytics/CtaClickListener';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** * Permite deshabilitar el tracking en páginas específicas (ej. Login o Error)
   * @default true
   */
  withTracking?: boolean;
}

export function PageShell({
  children,
  className,
  withTracking = true,
}: PageShellProps) {
  return (
    <>
      {/* Telemetría Silenciosa 
          Se montan aquí para asegurar cobertura total en el App Router 
      */}
      {withTracking && (
        <React.Suspense fallback={null}>
          <GoogleAnalytics />
          <PageViewListener />
          <CtaClickListener />
        </React.Suspense>
      )}

      <main 
        className={clsx(
          'mx-auto w-full max-w-5xl px-4 py-10 md:py-16',
          'min-h-[80vh] animate-in fade-in duration-700', // Sutil entrada visual
          className
        )}
      >
        {children}
      </main>
    </>
  );
}