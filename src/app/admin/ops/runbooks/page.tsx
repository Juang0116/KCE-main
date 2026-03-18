// src/app/admin/ops/runbooks/page.tsx
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
  FileCode
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'OPS Runbooks | Manual de Mitigación KCE',
  description: 'Protocolos oficiales de respuesta a incidentes para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

type RB = { kind: string; title: string; steps: string[] };

const RUNBOOKS: RB[] = [
  {
    kind: 'checkout_error',
    title: 'Fallas en Checkout (Stripe Session)',
    steps: [
      'Verificar llaves de Stripe en Vercel: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET y SITE_URL.',
      'Confirmar que la ruta /api/checkout retorne 200 localmente y que los CSP no estén bloqueando el origen.',
      'Auditar Dashboard de Stripe: buscar errores de precio inválido, moneda o sesiones no creadas.',
      'Inspeccionar meta en /admin/ops/incidents: revisar slug, fecha e ID de solicitud para reproducir.',
      'Si el pico persiste, activar ops_pause:checkout durante 15 min mientras se corrige la config.',
    ],
  },
  {
    kind: 'email_send_error',
    title: 'Fallas de Envío (Resend / Templates)',
    steps: [
      'Validar RESEND_API_KEY, EMAIL_FROM y EMAIL_REPLY_TO en el entorno de producción.',
      'Revisar Dashboard de Resend: verificar rebotes (bounces), dominios no validados o límites de tasa.',
      'Si hay adjuntos (PDF), validar tamaño y encriptación base64.',
      'Pausar ops_pause:email si hay reintentos en cascada; la cola de salida marcará como fallido automáticamente.',
    ],
  },
  {
    kind: 'admin_signed_action_invalid',
    title: 'Acción Firmada Inválida (Nonce/Exp)',
    steps: [
      'Confirmar sincronización de hora del navegador (fallos de exp por desfase de reloj).',
      'Validar allowlist de Origin/Referer (evitar conflicto entre localhost y producción).',
      'Asegurar que LINK_TOKEN_SECRET o SIGNED_ACTION_SECRET sean estables y estén configurados.',
      'Analizar meta del incidente: detectar si el motivo es expiración, replay o mismatch de origen.',
    ],
  },
];

function anchor(kind: string) {
  return encodeURIComponent(kind);
}

/**
 * AdminOpsRunbooksPage:
 * Unidad de documentación operativa. 
 * Centraliza los pasos de mitigación para incidentes conocidos del núcleo de KCE.
 */
export default async function AdminOpsRunbooksPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1200px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE PROTOCOLOS */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div className="space-y-4">
          <Link href="/admin/ops/incidents" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50 hover:text-brand-blue transition-all">
            <ArrowLeft className="h-3 w-3" /> Operations Center: /incidents
          </Link>
          <div className="space-y-1">
            <h1 className="font-heading text-4xl text-brand-blue leading-tight">
              OPS <span className="text-brand-yellow italic font-light">Runbooks</span>
            </h1>
            <p className="text-sm text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
              Manuales de mitigación estándar. Guías de paso a paso para resolver incidentes frecuentes 
              y restaurar la integridad de los servicios de KCE.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-6 py-3 rounded-2xl shadow-inner">
           <BookOpen className="h-5 w-5 text-brand-blue" />
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Knowledge Base</p>
              <p className="text-[9px] font-mono text-brand-blue/40 uppercase">v4.0 Verified Protocols</p>
           </div>
        </div>
      </header>

      {/* 02. LISTADO DE PROCEDIMIENTOS */}
      <div className="grid gap-8">
        {RUNBOOKS.map((rb, idx) => (
          <article
            key={rb.kind}
            id={anchor(rb.kind)}
            className="group relative rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-2xl transition-all hover:border-brand-blue/20 overflow-hidden"
          >
            {/* Decoración lateral por índice */}
            <div className="absolute left-0 top-0 h-full w-1.5 bg-brand-blue opacity-10 group-hover:opacity-100 transition-opacity" />
            
            <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 border-b border-[var(--color-border)] pb-8">
               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                        <FileCode className="h-4 w-4" />
                     </div>
                     <h2 className="font-heading text-2xl text-brand-dark">{rb.title}</h2>
                  </div>
                  <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-brand-blue/40">
                     Internal identifier: {rb.kind}
                  </p>
               </div>
               <div className="px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[9px] font-bold uppercase tracking-widest text-emerald-700 shadow-sm">
                  Active Protocol
               </div>
            </header>

            <div className="space-y-6">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
                  <Zap className="h-3 w-3" /> Pasos de Mitigación (Orden de Ejecución)
               </div>
               
               <ol className="grid gap-4">
                 {rb.steps.map((s, i) => (
                   <li key={i} className="flex gap-5 group/item">
                     <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[10px] font-mono font-bold text-brand-blue group-hover/item:bg-brand-blue group-hover/item:text-white transition-all">
                        {i + 1}
                     </div>
                     <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/80 pt-0.5 italic">
                        {s}
                     </p>
                   </li>
                 ))}
               </ol>
            </div>

            {/* Footer de integridad por Runbook */}
            <footer className="mt-12 pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
               <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/20">
                  <ShieldCheck className="h-3 w-3" /> Verified by KCE Ops
               </div>
               <Link href={`/admin/ops/incidents?kind=${rb.kind}`} className="text-[9px] font-bold uppercase tracking-widest text-brand-blue hover:underline">
                  Ver incidentes relacionados →
               </Link>
            </footer>
          </article>
        ))}
      </div>

      {/* FOOTER DE SOBERANÍA */}
      <footer className="mt-16 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Terminal className="h-3.5 w-3.5" /> High-Confidence Documentation
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Zap className="h-3.5 w-3.5" /> Fast-Recovery Protocol v4.2
        </div>
      </footer>
      
    </main>
  );
}