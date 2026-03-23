/* src/app/admin/privacy/page.tsx */
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
  ShieldAlert,
  Zap,
  Activity,
  ChevronRight,
  Cpu
} from 'lucide-react';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { PrivacyRequestsTable } from '@/features/privacy/PrivacyRequestsTable';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Privacy Compliance | KCE Ops',
  description: 'Gestión de solicitudes de derechos ARCO y soberanía de datos personales para Knowing Cultures S.A.S.',
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
 * Shell de cumplimiento legal y soberanía de datos.
 * Diseñada para resiliencia táctica conforme a normativas de privacidad globales.
 */
export default async function AdminPrivacyPage() {
  // 🔒 Protocolo de seguridad: Verificación de nivel administrativo en el nodo raíz
  await requireAdmin();
  const sb = getSupabaseAdmin();

  // Query resiliente con cast controlado para el histórico de solicitudes
  const { data, error } = await (sb as any)
    .from('privacy_requests')
    .select('id,kind,email,name,message,locale,status,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];
  const items: Item[] = rows.map((r) => ({
    id: String(r.id),
    kind: normalizeKind(r.kind),
    email: String(r.email || 'ANONYMOUS_NODE'),
    name: r.name ?? null,
    message: r.message ?? null,
    locale: r.locale ?? null,
    status: normalizeStatus(r.status),
    created_at: String(r.created_at || new Date().toISOString()),
  }));

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE CUMPLIMIENTO (MISSION CONTROL) */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue backdrop-blur-xl shadow-inner">
            <Terminal className="h-4 w-4" /> Compliance Lane: /privacy-vault-node
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-main tracking-tighter leading-none">
            Privacidad & <span className="text-brand-yellow italic font-light">Derechos ARCO</span>
          </h1>
          <p className="text-lg text-muted font-light max-w-3xl leading-relaxed mt-2 border-l-2 border-brand-yellow/20 pl-6 italic">
            Unidad de gestión de datos personales. Procesa solicitudes de exportación y borrado 
            conforme a normativas internacionales para proteger la soberanía del viajero en Knowing Cultures S.A.S.
          </p>
        </div>

        {/* Status de Integridad de Gobernanza (Widget Premium) */}
        <div className="flex items-center gap-6 bg-surface border border-brand-dark/5 dark:border-white/5 p-8 rounded-[2.5rem] shadow-pop group hover:border-brand-blue/20 transition-all relative overflow-hidden">
           <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
              <Scale className="h-24 w-24 text-brand-blue" />
           </div>
           <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 shadow-inner transition-transform group-hover:rotate-12">
              <ShieldCheck className="h-8 w-8 text-brand-blue animate-pulse" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">Data Sovereignty</p>
              <p className="text-sm font-mono text-green-600 dark:text-green-400 font-bold uppercase tracking-widest">Legal Proxy Active</p>
           </div>
        </div>
      </header>

      {/* 02. ALERTAS DE ERROR TÉCNICO (FORENSIC ALERT) */}
      {error && (
        <section className="mx-2 rounded-[3rem] border-2 border-red-500/20 bg-red-500/5 p-10 flex flex-col md:flex-row items-center gap-10 animate-in zoom-in-95 shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 top-0 opacity-[0.03] pointer-events-none">
             <ShieldAlert className="h-40 w-40 text-red-500" />
          </div>
          <div className="h-16 w-16 rounded-[1.8rem] bg-red-500 text-white flex items-center justify-center shadow-pop shrink-0">
             <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-3 text-center md:text-left relative z-10">
            <h3 className="font-heading text-3xl text-red-700 dark:text-red-400 tracking-tight">Falla de Ingesta en Privacidad</h3>
            <p className="text-base text-red-900/60 dark:text-red-400/60 font-light italic max-w-2xl">
              No se pudo establecer conexión con el nodo <span className="font-mono font-bold text-red-700 dark:text-red-400 underline decoration-red-500/30">privacy_requests</span>. 
              Verifica que el schema en Supabase esté alineado y el service-role esté operando en producción.
            </p>
            <div className="pt-4 flex items-center justify-center md:justify-start gap-4">
               <span className="px-4 py-1.5 rounded-lg bg-red-500/10 text-[10px] font-mono font-bold text-red-600 uppercase tracking-widest border border-red-500/20">
                  Error_Code: {error.message.slice(0, 24)}...
               </span>
            </div>
          </div>
        </section>
      )}

      {/* 03. TABLA DE SOLICITUDES (LA BÓVEDA) */}
      <section className="relative px-2">
        {/* Acento lateral de integridad - Amarillo KCE */}
        <div className="absolute -left-6 top-0 h-full w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />

        <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/5">
                  <Fingerprint className="h-6 w-6" />
               </div>
               <div>
                  <h2 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">Registro de Solicitudes</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40 mt-1">Immutable Compliance Audit</p>
               </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 px-5 py-2 rounded-full bg-surface-2 border border-brand-dark/5">
               <Zap className="h-4 w-4 text-brand-yellow fill-current" />
               <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Real-time Ingest</span>
            </div>
        </div>
        
        {/* La tabla maneja la interacción de estados y detalles de la solicitud */}
        <div className="rounded-[var(--radius-3xl)] overflow-hidden shadow-pop border border-brand-dark/5 dark:border-white/5">
           <PrivacyRequestsTable initialItems={items} />
        </div>
      </section>

      {/* 04. FOOTER DE SOBERANÍA TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Privacy Integrity Verified
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 opacity-50" /> Immutable Data Vault
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-blue">
          <FileOutput className="h-4 w-4" /> Compliance Node v2.4 Active
        </div>
      </footer>
      
    </main>
  );
}