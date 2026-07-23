/* src/app/admin/layout.tsx */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminTopBar } from '@/features/admin/AdminTopBar';

export const metadata: Metadata = {
  title: 'Operations Command | Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-base transition-colors duration-500 md:flex-row">
      {/* Sidebar de Gestión */}
      <aside className="z-50 shrink-0 md:h-full">
        <AdminTopBar />
      </aside>

      {/* Área de Trabajo - Máxima Concentración */}
      <main className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 lg:p-12">
        <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
