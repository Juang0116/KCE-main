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
  Database,
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Incident Mitigation | KCE Ops',
  description:
    'Protocolos oficiales de respuesta a incidentes y manuales de recuperación para Knowing Cultures S.A.S.',
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
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-[1200px] space-y-12 p-4 pb-24 duration-1000 md:p-6">
      {/* 01. CABECERA DE PROTOCOLOS (MISSION CONTROL) */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <Link
            href="/admin/ops/incidents"
            className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue transition-transform hover:translate-x-[-4px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Operations Center: /incidents
          </Link>
          <h1 className="font-heading text-5xl leading-none tracking-tighter text-main md:text-7xl">
            OPS <span className="font-light italic text-brand-yellow">Runbooks</span>
          </h1>
          <p className="mt-2 max-w-3xl border-l-2 border-brand-yellow/20 pl-6 text-lg font-light italic leading-relaxed text-muted">
            Manuales de mitigación estándar. Guías técnicas paso a paso para resolver incidentes
            críticos y restaurar la integridad de Knowing Cultures S.A.S.
          </p>
        </div>

        {/* Knowledge Base Widget */}
        <div className="flex items-center gap-5 rounded-[2rem] border border-brand-dark/5 bg-surface px-8 py-5 shadow-pop dark:border-white/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
              Knowledge Base
            </p>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-brand-blue">
              v4.0 Verified
            </p>
          </div>
        </div>
      </header>

      {/* 02. LISTADO DE PROCEDIMIENTOS (THE VAULT) */}
      <div className="grid gap-10">
        {RUNBOOKS.map((rb, idx) => (
          <article
            key={rb.kind}
            id={anchor(rb.kind)}
            className="group relative overflow-hidden rounded-[3.5rem] border border-brand-dark/5 bg-surface p-10 shadow-pop transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-white/5 md:p-14"
          >
            {/* Acento lateral dinámico */}
            <div className="absolute left-0 top-0 h-full w-2 bg-brand-blue opacity-10 transition-opacity group-hover:opacity-100" />

            <header className="mb-12 flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 sm:flex-row sm:items-start">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue shadow-inner transition-transform group-hover:scale-110">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-3xl tracking-tight text-main md:text-4xl">
                    {rb.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-brand-dark/5 bg-surface-2 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                    <Hash className="mr-1 inline h-3 w-3 opacity-40" /> {rb.kind}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-green-700 shadow-sm dark:text-green-400">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                Protocolo Activo
              </div>
            </header>

            <div className="space-y-8">
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                <Zap className="h-4 w-4 fill-current" /> Mitigación: Secuencia de Ejecución
              </div>

              <div className="grid gap-6">
                {rb.steps.map((s, i) => (
                  <div
                    key={i}
                    className="group/item flex gap-6"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-brand-dark/10 bg-surface-2 font-mono text-xs font-bold text-brand-blue shadow-inner transition-all duration-300 group-hover/item:bg-brand-blue group-hover/item:text-white">
                      {i + 1}
                    </div>
                    <p className="pt-1 text-base font-light italic leading-relaxed text-main opacity-80 transition-opacity group-hover/item:opacity-100">
                      {s}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer interno del Runbook */}
            <footer className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-brand-dark/5 pt-8 dark:border-white/5 sm:flex-row">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-30">
                <ShieldCheck className="h-4 w-4" /> Verified by KCE Operations MMXXVI
              </div>
              <Link
                href={`/admin/ops/incidents?kind=${rb.kind}`}
                className="group/link flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue transition-colors hover:text-brand-yellow"
              >
                Analizar Incidentes{' '}
                <ChevronRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </footer>
          </article>
        ))}
      </div>

      {/* 03. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4 text-brand-blue" /> High-Confidence Documentation
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Layers className="h-4 w-4 opacity-50" /> Fast-Recovery Protocol v4.2
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4 animate-pulse" /> Live Integrity Shield
        </div>
      </footer>
    </main>
  );
}
