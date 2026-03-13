import 'server-only';

import AdminRunbookClient from './AdminRunbookClient';

import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Runbook | Admin | KCE',
  robots: { index: false, follow: false },
};

export default function AdminRunbookPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-2xl text-brand-blue">Runbook de aceptación</h1>
      <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
        Checklist guiado (manual) para validar flows críticos: tours → checkout → webhook → booking
        → invoice/email → reviews → CRM → bot/tickets → UTM.
      </p>

      <div className="mt-6">
        <AdminRunbookClient />
      </div>
    </main>
  );
}
