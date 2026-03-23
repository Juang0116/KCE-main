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
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-base md:flex-row transition-colors duration-500">
      {/* Sidebar de Gestión */}
      <aside className="z-50 md:h-full shrink-0">
        <AdminTopBar />
      </aside>
      
      {/* Área de Trabajo - Máxima Concentración */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 lg:p-12 custom-scrollbar">
        <div className="mx-auto max-w-7xl animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}