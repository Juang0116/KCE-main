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
    <>
      <AdminTopBar />
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">{children}</div>
    </>
  );
}
