/* src/app/admin/ops/runbooks/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  BookOpen, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Layers,
  ChevronRight,
  Hash,
  Database
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Incident Mitigation | KCE Ops',
  description: 'Protocolos oficiales de respuesta a incidentes y manuales de recuperación para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

type RB = { kind: string; title: string; steps: string[] };

const RUNBOOKS: RB[] = [
  {
    kind: 'checkout_error',
    title: 'Fallas en Checkout (Stripe Session)',
    steps: [
      'Verificar variables de entorno en Vercel: STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET.',
      'Confirmar que la ruta /api/checkout retorne 200 y que los CSP no estén bloqueando el origen.',
      'Auditar Dashboard de Stripe: buscar errores de "Price Invalid" o sesiones con moneda errónea.',
      'Inspeccionar traza en /admin/events: revisar el slug del tour y el ID de sesión fallido.',
      'Si el fallo es masivo, activar ops_pause:checkout (Protocolo de Degradación) durante 15 min.',
    ],
  },
  {
    kind: 'email_send_error',
    title: 'Fallas de Envío (Resend / Templates)',
    steps: [
      'Validar integridad de RESEND_API_KEY y EMAIL_FROM en el núcleo de producción.',
      'Revisar Dashboard de Resend: verificar rebotes (bounces) o dominios con reputación degradada.',
      'Si hay adjuntos (PDF de tickets), validar que el encoding base64 no exceda los 10MB.',
      'Pausar ops_pause:email si hay reintentos en cascada para evitar bloqueos de IP.',
    ],
  },
  {
    kind: 'admin_signed_action_invalid',
    title: 'Acción Firmada Inválida (Nonce/Exp)',
    steps: [
      'Confirmar sincronización de hora UTC del servidor y del navegador del operador.',
      'Validar allowlist de Origin/Referer para evitar colisiones entre el nodo local y el Kernel.',
      'Asegurar que SIGNED_ACTION_SECRET sea estable y no haya sido rotado recientemente.',
      'Analizar rastro del incidente: detectar si el motivo es expiración de token o mismatch de huella.',
    ],
  },
];

function anchor(kind: string) {
  return encodeURIComponent(kind);
}

/**
 * AdminOpsRunbooksPage:
 * Unidad de documentación operativa. 
 * Centraliza los pasos de mitigación para blindar el núcleo de KCE.
 */
export default async function AdminOpsRunbooksPage() {
  // 🔒 Validación de integridad de acceso administrativo
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1200px] space-y-12 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE PROTOCOLOS (MISSION CONTROL) */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <Link href="/admin/ops/incidents" className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue hover:translate-x-[-4px] transition-transform">
            <ArrowLeft className="h-3.5 w-3.5" /> Operations Center: /incidents
          </Link>
          <h1 className="font-heading text-5xl md:text-7xl text-main tracking-tighter leading-none">
            OPS <span className="text-brand-yellow italic font-light">Runbooks</span>
          </h1>
          <p className="text-lg text-muted font-light max-w-3xl leading-relaxed mt-2 border-l-2 border-brand-yellow/20 pl-6 italic">
            Manuales de mitigación estándar. Guías técnicas paso a paso para resolver incidentes críticos 
            y restaurar la integridad de Knowing Cultures S.A.S.
          </p>
        </div>

        {/* Knowledge Base Widget */}
        <div className="flex items-center gap-5 bg-surface border border-brand-dark/5 dark:border-white/5 px-8 py-5 rounded-[2rem] shadow-pop">
           <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
              <BookOpen className="h-6 w-6" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">Knowledge Base</p>
              <p className="text-xs font-mono font-bold text-brand-blue uppercase tracking-widest">v4.0 Verified</p>
           </div>
        </div>
      </header>

      {/* 02. LISTADO DE PROCEDIMIENTOS (THE VAULT) */}
      <div className="grid gap-10">
        {RUNBOOKS.map((rb, idx) => (
          <article
            key={rb.kind}
            id={anchor(rb.kind)}
            className="group relative rounded-[3.5rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-14 shadow-pop transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
          >
            {/* Acento lateral dinámico */}
            <div className="absolute left-0 top-0 h-full w-2 bg-brand-blue opacity-10 group-hover:opacity-100 transition-opacity" />
            
            <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 mb-12 border-b border-brand-dark/5 dark:border-white/5 pb-10">
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-inner group-hover:scale-110 transition-transform">
                        <FileCode className="h-5 w-5" />
                     </div>
                     <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight">{rb.title}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="px-3 py-1 rounded-lg bg-surface-2 border border-brand-dark/5 text-[10px] font-mono text-muted uppercase tracking-widest">
                        <Hash className="h-3 w-3 inline mr-1 opacity-40" /> {rb.kind}
                     </div>
                  </div>
               </div>
               <div className="px-6 py-2 rounded-full border border-green-500/20 bg-green-500/5 text-[10px] font-bold uppercase tracking-[0.2em] text-green-700 dark:text-green-400 shadow-sm flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Protocolo Activo
               </div>
            </header>

            <div className="space-y-8">
               <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                  <Zap className="h-4 w-4 fill-current" /> Mitigación: Secuencia de Ejecución
               </div>
               
               <div className="grid gap-6">
                 {rb.steps.map((s, i) => (
                   <div key={i} className="flex gap-6 group/item">
                     <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-surface-2 border border-brand-dark/10 text-xs font-mono font-bold text-brand-blue shadow-inner group-hover/item:bg-brand-blue group-hover/item:text-white transition-all duration-300">
                        {i + 1}
                     </div>
                     <p className="text-base font-light leading-relaxed text-main pt-1 opacity-80 group-hover/item:opacity-100 transition-opacity italic">
                        {s}
                     </p>
                   </div>
                 ))}
               </div>
            </div>

            {/* Footer interno del Runbook */}
            <footer className="mt-14 pt-8 border-t border-brand-dark/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-30">
                  <ShieldCheck className="h-4 w-4" /> Verified by KCE Operations MMXXVI
               </div>
               <Link 
                 href={`/admin/ops/incidents?kind=${rb.kind}`} 
                 className="group/link flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue hover:text-brand-yellow transition-colors"
               >
                  Analizar Incidentes <ChevronRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
               </Link>
            </footer>
          </article>
        ))}
      </div>

      {/* 03. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4 text-brand-blue" /> High-Confidence Documentation
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Layers className="h-4 w-4 opacity-50" /> Fast-Recovery Protocol v4.2
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4 animate-pulse" /> Live Integrity Shield
        </div>
      </footer>
      
    </main>
  );
}