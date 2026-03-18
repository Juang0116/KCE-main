// src/app/admin/rbac/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldCheck, 
  Terminal, 
  Database, 
  Fingerprint, 
  Lock, 
  UserCheck,
  ShieldAlert,
  History
} from 'lucide-react';

import AdminRbacClient from './AdminRbacClient';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Identity & Governance | Admin KCE',
  description: 'Gestión de soberanía, control de accesos basados en roles y protocolos de emergencia para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminRbacPage:
 * Shell de servidor para la gobernanza de identidad (IAM).
 * Establece el marco de soberanía y auditoría antes de montar la terminal de gestión de roles.
 */
export default async function AdminRbacPage() {
  // Garantizamos acceso administrativo de alto nivel en el nodo de servidor
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO (IAM VAULT) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Authority Lane: /identity-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue tracking-tight leading-tight">
            Gobernanza & <span className="text-brand-yellow italic font-light">Soberanía</span>
          </h1>
          <p className="text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de Control de Acceso (RBAC). Define políticas de mínimos privilegios, gestiona 
            bindings de operadores y supervisa protocolos de elevación crítica (Break-Glass).
          </p>
        </div>

        {/* Status de Integridad de Identidad */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
              <Lock className="h-6 w-6 text-brand-blue" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Sovereign State</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-tighter">Auth Node Verified</p>
           </div>
        </div>
      </header>

      {/* 02. ALERTA DE AUDITORÍA PERMANENTE */}
      <section className="mx-2 rounded-[2.5rem] border border-brand-blue/20 bg-brand-blue/5 p-8 flex items-start md:items-center gap-6 shadow-inner transition-all hover:bg-brand-blue/[0.08]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
           <History className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/80">Registro Inmutable de Acciones</p>
          <p className="text-base font-light text-brand-dark/80 italic">
            "Todo cambio en la matriz de permisos, asignación de roles o solicitudes de break-glass queda 
            firmado y auditado en tiempo real dentro del nodo <span className="font-mono font-bold text-brand-blue">/ops/audit-log</span>."
          </p>
        </div>
      </section>

      {/* 03. TERMINAL MAESTRA DE RBAC (CLIENT COMPONENT) */}
      <section className="relative pt-4">
         <div className="mb-8 flex items-center gap-4 px-2">
            <Fingerprint className="h-5 w-5 text-brand-blue opacity-30" />
            <h2 className="font-heading text-2xl text-brand-dark">Identity Management Interface</h2>
         </div>

         {/* Acento lateral de integridad de la Bóveda */}
         <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
         
         {/* El cliente maneja la lógica de roles, bindings, templates y break-glass */}
         <AdminRbacClient />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Identity Sovereignty Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> RBAC Node v4.2
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldAlert className="h-3.5 w-3.5" /> Zero-Trust Protocol
        </div>
      </footer>
      
    </main>
  );
}