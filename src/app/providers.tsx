// src/app/providers.tsx
'use client';

import SEOProvider from '@/components/seo/SEOProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SEOProvider />
      {children}
    </>
  );
}
