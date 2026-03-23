// src/app/admin/sales/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminSalesCockpitClient } from './AdminSalesCockpitClient';
import { Container } from '@/components/ui/Container';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sales Cockpit | KCE Intelligence',
  description: 'Consola táctica de conversión y análisis predictivo de ventas.',
  robots: { index: false, follow: false },
};

export default async function AdminSalesPage() {
  // 01. Verificación de soberanía (Seguridad a nivel de servidor)
  await requireAdmin();

  return (
    <main className="min-h-screen bg-surface-main/50">
      <Container className="py-12">
        {/* Hemos movido el Header dentro del CockpitClient o lo manejamos aquí 
          de forma minimalista para dejar que el Cockpit tome el protagonismo visual.
        */}
        <div className="animate-in fade-in duration-700">
          <AdminSalesCockpitClient />
        </div>
      </Container>
    </main>
  );
}