'use client';

import * as React from 'react';
import SEOProvider from '@/components/seo/SEOProvider';

/**
 * Providers Wrapper: Centraliza todos los contextos de cliente (Theme, Auth, Query, etc.)
 * Se importa en el layout.tsx raíz para envolver el {children}.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  // Estado para manejar la hidratación si fuera necesario en el futuro
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <React.Fragment>
      {/* 1. SEO & Analytics: Inyecta metadatos dinámicos o scripts de rastreo */}
      <SEOProvider />

      {/* 2. Espacio para Providers Futuros:
          - <ThemeProvider ...>
          - <QueryClientProvider ...>
          - <AuthProvider ...>
      */}

      {/* Si algún provider causa errores de hidratación (flicker), 
          puedes usar el estado 'mounted' para renderizar condicionalmente.
      */}
      {children}
    </React.Fragment>
  );
}