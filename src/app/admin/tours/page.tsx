/* src/app/admin/tours/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/adminGuard';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { listTours } from '@/features/tours/catalog.server';
import {
  Compass, Plus, Globe, Clock, Star,
  CheckCircle2, XCircle, Edit3, Eye,
  MapPin, DollarSign, Terminal, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AdminToursClient } from './AdminToursClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Catálogo de Tours | KCE Ops',
  robots: { index: false, follow: false },
};

export default async function AdminToursPage() {
  await requireAdmin();

  // Load tour catalog via server
  const result = await listTours({ limit: 200 }).catch(() => ({ items: [], total: 0, source: 'mock' as const }));

  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Compass className="h-3.5 w-3.5" /> Catálogo de Experiencias
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
            Gestor de Tours
          </h1>
          <p className="mt-2 text-sm text-muted font-light max-w-xl">
            {result.total} experiencias · Fuente: <span className="font-semibold text-brand-blue">{result.source}</span>
          </p>
        </div>
        <Link href="/admin/tours/new">
          <Button className="rounded-full bg-brand-blue text-white hover:bg-brand-dark transition-all text-[10px] font-bold uppercase tracking-widest px-8 h-12 shadow-pop">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Tour
          </Button>
        </Link>
      </header>

      <AdminToursClient initialItems={result.items} />
    </main>
  );
}
