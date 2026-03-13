// src/app/admin/conversations/[id]/page.tsx
import 'server-only';

import Link from 'next/link';

import { AdminConversationClient } from './AdminConversationClient';

import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Conversación | KCE',
  robots: { index: false, follow: false },
};

export default async function AdminConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-brand-blue">Conversación</h1>
        <Link
          href="/admin/conversations"
          className="text-sm text-brand-blue hover:underline"
        >
          Volver
        </Link>
      </div>
      <AdminConversationClient id={id} />
    </main>
  );
}
