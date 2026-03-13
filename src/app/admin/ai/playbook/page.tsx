// src/app/admin/ai/playbook/page.tsx
import 'server-only';

import type { Metadata } from 'next';

import { AdminAiPlaybookClient } from './AdminAiPlaybookClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'IA Playbook | Admin | KCE',
  robots: { index: false, follow: false },
};

export default function AdminAiPlaybookPage() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-brand-blue">IA Playbook</h1>
        <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
          Aquí defines respuestas/políticas aprobadas por KCE. El endpoint{' '}
          <code className="font-mono">/api/ai</code> inyecta estos snippets en su prompt para dar respuestas consistentes.
        </p>
      </div>

      <AdminAiPlaybookClient />
    </main>
  );
}
