import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminTopBar } from '@/features/admin/AdminTopBar';

// Admin area: nunca indexar.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[color:var(--color-bg)] md:flex-row">
      {/* El componente se sigue llamando AdminTopBar internamente, pero ahora actúa como un Sidebar Pro */}
      <AdminTopBar />
      
      {/* Área principal de contenido */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-10">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}