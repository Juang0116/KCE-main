// src/app/admin/privacy/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldCheck, 
  Terminal, 
  Database, 
  UserX, 
  FileOutput, 
  Fingerprint, 
  Scale,
  ShieldAlert
} from 'lucide-react';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { PrivacyRequestsTable } from '@/features/privacy/PrivacyRequestsTable';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Data Privacy Vault | Admin KCE',
  description: 'Gestión de solicitudes de derechos ARCO para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

type Row = {
  id: string;
  kind: string | null;
  email: string | null;
  name: string | null;
  message: string | null;
  locale: string | null;
  status: string | null;
  created_at: string | null;
};

type Item = {
  id: string;
  kind: 'export' | 'delete';
  email: string;
  name: string | null;
  message: string | null;
  locale: string | null;
  status: string;
  created_at: string;
};

function normalizeKind(kind: string | null | undefined): 'export' | 'delete' {
  return kind === 'delete' ? 'delete' : 'export';
}

function normalizeStatus(status: string | null | undefined): 'new' | 'processing' | 'done' | 'rejected' {
  const s = (status || '').toLowerCase();
  if (s === 'processing' || s === 'done' || s === 'rejected') return s;
  return 'new';
}

/**
 * AdminPrivacyPage:
 * Shell de cumplimiento legal. Maneja la ingesta de solicitudes de privacidad.
 * Diseñada para resiliencia de tipos mientras el schema se estabiliza.
 */
export default async function AdminPrivacyPage() {
  await requireAdmin();
  const sb = getSupabaseAdmin();

  // Query resiliente con cast controlado para evitar fallos de build
  const { data, error } = await (sb as any)
    .from('privacy_requests')
    .select('id,kind,email,name,message,locale,status,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];
  const items: Item[] = rows.map((r) => ({
    id: String(r.id),
    kind: normalizeKind(r.kind),
    email: String(r.email || ''),
    name: r.name ?? null,
    message: r.message ?? null,
    locale: r.locale ?? null,
    status: normalizeStatus(r.status),
    created_at: String(r.created_at || new Date().toISOString()),
  }));

  return (
    <main className="mx-auto max-w-[1400px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE CUMPLIMIENTO (GOVERNANCE VAULT) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Compliance Lane: /privacy-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue tracking-tight leading-tight">
            Privacidad & <span className="text-brand-yellow italic font-light">Derechos ARCO</span>
          </h1>
          <p className="text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de gestión de datos personales. Procesa solicitudes de exportación y borrado 
            conforme a normativas internacionales para proteger la soberanía del usuario en KCE.
          </p>
        </div>

        {/* Status de Integridad de Gobernanza */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-surface)] shadow-sm transition-transform group-hover:rotate-12">
              <Scale className="h-6 w-6 text-brand-blue" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Data Sovereignty</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-tighter">Legal Proxy Active</p>
           </div>
        </div>
      </header>

      {/* 02. ALERTAS DE ERROR TÉCNICO */}
      {error && (
        <section className="mx-2 rounded-[2.5rem] border-2 border-rose-500/20 bg-rose-500/5 p-8 flex items-start gap-6 animate-in zoom-in-95">
          <div className="h-12 w-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shrink-0">
             <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl text-rose-700">Falla de Ingesta en Privacidad</h3>
            <p className="text-sm text-rose-900/60 font-light italic">
              No se pudo establecer conexión con el nodo <span className="font-mono font-bold">privacy_requests</span>. 
              Verifica que el schema en Supabase esté alineado y el service-role activo.
            </p>
            <p className="text-xs font-mono text-rose-500/50 mt-4 uppercase">Error_Log: {error.message}</p>
          </div>
        </section>
      )}

      {/* 03. TABLA DE SOLICITUDES (INTERACTIVA) */}
      <section className="relative">
        <div className="mb-8 flex items-center gap-4 px-2">
           <Fingerprint className="h-5 w-5 text-brand-blue opacity-30" />
           <h2 className="font-heading text-2xl text-[color:var(--color-text)]">Registro Oficial de Solicitudes</h2>
        </div>

        {/* Acento lateral de integridad de la Bóveda */}
        <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-yellow opacity-10" />
        
        <PrivacyRequestsTable initialItems={items} />
      </section>

      {/* 04. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Privacy Integrity Verified
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Immutable Data Vault
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <FileOutput className="h-3.5 w-3.5" /> Export Compliance v2.4
        </div>
      </footer>
      
    </main>
  );
}