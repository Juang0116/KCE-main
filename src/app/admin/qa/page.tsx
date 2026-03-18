// src/app/admin/qa/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Rocket, 
  Terminal, 
  ShieldCheck, 
  Database, 
  Layers, 
  Zap, 
  ShieldAlert, 
  ArrowUpRight,
  Activity,
  Smartphone,
  CheckCircle2
} from 'lucide-react';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import AdminQaClient from './AdminQaClient';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Release Engineering | Admin KCE',
  description: 'Unidad de validación pre-vuelo y aseguramiento de flujo de revenue para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminQaPage:
 * Shell de servidor para el control de calidad y puertas de lanzamiento.
 * Establece el marco estratégico para la validación E2E del ecosistema KCE.
 */
export default async function AdminQaPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO (RELEASE VAULT) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Deployment Lane: /release-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight tracking-tight">
            QA & <span className="text-brand-yellow italic font-light">Release Gates</span>
          </h1>
          <p className="text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de aseguramiento de integridad. Valida si el núcleo de KCE puede cobrar, persistir y 
            entregar la promesa premium bajo presión de tráfico real.
          </p>
        </div>

        {/* Status de Preparación de Vuelo */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner relative overflow-hidden group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
              <Rocket className="h-6 w-6 text-brand-blue" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Launch Readiness</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase">Pre-Flight Mode Active</p>
           </div>
        </div>
      </header>

      {/* 02. ESTRATEGIA EJECUTIVA (DECISION ENGINE) */}
      <AdminExecutivePanel
        eyebrow="release gate"
        title="QA final y verdad del revenue para el escalado de KCE"
        description="Esta vista prioriza la velocidad de decisión: ¿podemos cobrar?, ¿la reserva es íntegra?, ¿el email llega? Si la respuesta es sí, el tráfico puede fluir."
        quickLinks={[
          { href: '/admin/command-center', label: 'Command center' },
          { href: '/admin/launch-hq', label: 'Launch HQ' },
          { href: '/admin/revenue', label: 'Revenue Truth', tone: 'primary' },
          { href: '/admin/bookings', label: 'Bookings' },
        ]}
        focusItems={[
          {
            label: 'qa base',
            title: 'Build & Preflight',
            body: 'Confirma build limpio y smoke estable antes de empujar ventas. La infraestructura no debe ser un obstáculo.',
            href: '/admin/qa',
            cta: 'Auditar QA',
          },
          {
            label: 'revenue e2e',
            title: 'Flujo Continuo',
            body: 'El punto crítico: Stripe, Webhook, Booking e Invoice. Un flujo sin huecos es un flujo que factura.',
            href: '/admin/revenue',
            cta: 'Ver Revenue',
          },
          {
            label: 'recovery',
            title: 'Salida Calmada',
            body: 'Si algo falla, el protocolo de recuperación (Heal) debe dejar al operador con una maniobra clara.',
            href: '/admin/ops/runbooks',
            cta: 'Runbooks',
          },
        ]}
        notes={[
          {
            title: 'Higiene Operativa',
            body: 'La pregunta no es si el código compila, sino si la operación aguanta el tráfico sin degradar la marca.',
          },
          {
            title: 'Promesa Premium',
            body: 'Aquí validamos el tramo final entre un MVP funcional y una experiencia 10/10 para el viajero.',
          },
        ]}
      />

      {/* 03. WORKBENCH DE OPERADOR */}
      <AdminOperatorWorkbench
        eyebrow="release engineering"
        title="Protocolo de Verificación Diaria"
        description="Secuencia de seguridad: QA Profundo -> Compra de prueba -> RC Verify -> Revisión manual en vertical -> Escalado de distribución."
        actions={[
          { href: '/admin/revenue', label: 'Revenue Desk', tone: 'primary' },
          { href: '/admin/bookings', label: 'Ver Reservas' },
          { href: '/admin/system', label: 'Monitor Infra' },
        ]}
        signals={[
          { label: 'build lane', value: 'CI + Smoke', note: 'Verdad de base técnica.' },
          { label: 'revenue lane', value: 'RC Verify', note: 'Validación de session_id real.' },
          { label: 'traveler lane', value: 'UX Vertical', note: 'Check de mobile sin fricción.' },
          { label: 'launch decision', value: 'Go / No-Go', note: 'Estado de soberanía operativa.' },
        ]}
      />

      {/* 04. MOTOR DINÁMICO DE QA (CLIENT COMPONENT) */}
      <section className="relative">
         <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-yellow opacity-10" />
         <AdminQaClient />
      </section>

      {/* 05. CHECKLIST DE CANDIDATO A LANZAMIENTO */}
      <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden relative group">
        <header className="p-8 md:p-10 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/40">Release candidate protocol</div>
            <h2 className="font-heading text-2xl text-brand-blue">Criterios de Aceptación para Escalado</h2>
          </div>
          <Link href="/admin/ops/runbooks" className="h-11 px-6 rounded-2xl border border-[var(--color-border)] bg-white text-[10px] font-bold uppercase tracking-widest text-brand-blue flex items-center hover:bg-brand-blue hover:text-white transition-all shadow-sm">
             Abrir Runbook Forense
          </Link>
        </header>

        <div className="p-8 md:p-10 grid gap-6 md:grid-cols-4">
          {[
            { t: 'Front Premium', c: 'Home, tours y checkout revisados en mobile vertical y desktop.', i: Smartphone },
            { t: 'Revenue Truth', c: 'Stripe, webhook, booking e invoice validados sobre ciclo real.', i: Zap },
            { t: 'Continuity Node', c: 'Chat y CRM conservan el contexto del viajero sin reinicios.', i: Activity },
            { t: 'Recovery Mode', c: 'Protocolos de curación dejan una salida clara ante fallas.', i: ShieldAlert }
          ].map((item, idx) => (
            <article key={idx} className="p-6 rounded-[2rem] border border-black/[0.03] bg-white hover:border-brand-blue/20 transition-all group/card">
              <div className="flex items-center gap-3 mb-4">
                 <div className="h-8 w-8 rounded-lg bg-brand-blue/5 text-brand-blue flex items-center justify-center">
                    <item.i className="h-4 w-4" />
                 </div>
                 <h3 className="text-sm font-bold text-brand-dark uppercase tracking-tight">{item.t}</h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--color-text)]/60 italic">{item.c}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Release Sovereignty Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Pipeline Node v4.4
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Integrity Verified
        </div>
      </footer>
      
    </main>
  );
}