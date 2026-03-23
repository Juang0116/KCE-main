/* src/app/admin/rbac/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldCheck, 
  Terminal, 
  Database, 
  Fingerprint, 
  Lock, 
  ShieldAlert,
  History,
  Activity,
  Cpu,
  Layers // ✅ Agrégalo aquí
} from 'lucide-react';

import AdminRbacClient from './AdminRbacClient';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Identity & Governance | KCE Ops',
  description: 'Gestión de soberanía, control de accesos basados en roles (RBAC) y protocolos de emergencia para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminRbacPage:
 * Shell de servidor para la gobernanza de identidad (IAM).
 * Establece el marco de soberanía y auditoría antes de montar la terminal de gestión de roles.
 */
export default async function AdminRbacPage() {
  // 🔒 Protocolo de seguridad: Verificación de nivel administrativo en el nodo raíz
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE ALTO MANDO (MISSION CONTROL) */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue backdrop-blur-xl shadow-inner">
            <Terminal className="h-4 w-4" /> Authority Lane: /identity-vault-01
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-main tracking-tighter leading-none">
            Gobernanza & <span className="text-brand-yellow italic font-light">Soberanía</span>
          </h1>
          <p className="text-lg text-muted font-light max-w-3xl leading-relaxed mt-2 border-l-2 border-brand-yellow/20 pl-6 italic">
            Unidad de Control de Acceso (RBAC). Define políticas de mínimos privilegios, gestiona 
            bindings de operadores y supervisa protocolos de elevación crítica (Break-Glass) de Knowing Cultures S.A.S.
          </p>
        </div>

        {/* Status de Integridad de Identidad (Widget Premium) */}
        <div className="flex items-center gap-6 bg-surface border border-brand-dark/5 dark:border-white/5 p-8 rounded-[2.5rem] shadow-pop group hover:border-brand-blue/20 transition-all relative overflow-hidden">
           <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
              <Cpu className="h-24 w-24 text-brand-blue" />
           </div>
           <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 shadow-inner transition-transform group-hover:rotate-12">
              <Lock className="h-8 w-8 text-brand-blue" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">Sovereign State</p>
              <p className="text-sm font-mono text-green-600 dark:text-green-400 font-bold uppercase tracking-widest">Auth Node Verified</p>
           </div>
        </div>
      </header>

      {/* 02. ALERTA DE AUDITORÍA PERMANENTE (SECURITY ADVISORY) */}
      <section className="mx-2 rounded-[3rem] border border-brand-blue/20 bg-brand-blue/5 p-10 flex flex-col md:flex-row items-center gap-10 shadow-inner relative overflow-hidden group">
        <div className="absolute -right-6 top-0 opacity-[0.03] pointer-events-none">
           <Activity className="h-40 w-40 text-brand-blue" />
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.8rem] bg-brand-blue text-white shadow-pop group-hover:scale-105 transition-transform">
           <History className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand-blue/60">Registro Inmutable de Acciones</p>
          <p className="text-xl font-light text-main italic leading-relaxed">
            &quot;Todo cambio en la matriz de permisos, asignación de roles o solicitudes de break-glass queda 
            firmado y auditado en tiempo real dentro del nodo <span className="font-mono font-bold text-brand-blue underline decoration-brand-blue/20">/ops/audit-log</span>.&quot;
          </p>
        </div>
      </section>

      {/* 03. TERMINAL MAESTRA DE RBAC (LOGIC COMPONENT) */}
      <section className="relative px-2">
         {/* Acento lateral de la Bóveda Identity - Amarillo KCE */}
         <div className="absolute -left-6 top-24 h-[calc(100%-6rem)] w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />

         <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/5">
                  <Fingerprint className="h-6 w-6" />
               </div>
               <div>
                  <h2 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">Management Interface</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40 mt-1">Hierarchical Permission Matrix</p>
               </div>
            </div>
         </div>
         
         {/* El cliente maneja la lógica de roles, bindings, templates y elevación de privilegios */}
         <AdminRbacClient />
      </section>

      {/* 04. FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Identity Sovereignty Active
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Layers className="h-4 w-4 opacity-50" /> RBAC Node v4.2
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <ShieldAlert className="h-4 w-4 animate-pulse" /> Zero-Trust Protocol Active
        </div>
      </footer>
      
    </main>
  );
}