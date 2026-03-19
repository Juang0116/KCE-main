import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldCheck, CreditCard, Headphones, 
  Zap, ArrowRight, Activity, 
  CheckCircle2, AlertCircle, 
  Map, History
} from 'lucide-react';

import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import { AdminBookingsClient } from './AdminBookingsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Gestión de Reservas | Admin KCE',
  description: 'Centro de cumplimiento, verificación de ingresos y monitoreo post-compra para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false }, // 🔒 Seguro para SEO
};

export default function AdminBookingsPage() {
  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CLIENTE PRINCIPAL (Header, Workbench, Filtros y Tabla) 
          Delegamos la responsabilidad de la UI principal a este componente.
      */}
      <section className="relative">
        <AdminBookingsClient />
      </section>

      {/* 02. BLUEPRINTS ESTRATÉGICOS (MATRICES SOP) 
          Guías operativas estáticas para el equipo de KCE.
      */}
      <div className="grid gap-8 lg:grid-cols-2 pt-8">
        
        {/* Recovery Matrix */}
        <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
             <Activity className="h-40 w-40 text-brand-blue" />
          </div>
          <header className="mb-8 border-b border-[var(--color-border)] pb-6 relative z-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50 mb-2">Protocolo de Acción</div>
            <h2 className="font-heading text-2xl text-brand-blue">Premium Recovery Matrix</h2>
            <p className="mt-2 text-sm text-[var(--color-text)]/50 font-light">Decide el nivel de intervención según el estado del booking.</p>
          </header>

          <div className="grid gap-4 relative z-10">
            {[
              { t: 'Charge Truth', c: 'Valida Stripe y persistencia antes de cualquier follow-up.', h: '/admin/revenue' },
              { t: 'Asset Rescue', c: 'Si falta invoice o calendar, abre recuperación inmediata.', h: '/admin/qa' },
              { t: 'Support Reopen', c: 'Reabre casos con contexto total, no solo por intuición.', h: '/admin/tickets' },
              { t: 'Post-Purchase Calm', c: 'Si todo está OK, el mejor movimiento es no intervenir.', h: '/admin/bookings' },
            ].map((item, i) => (
              <a key={i} href={item.h} className="group flex items-center justify-between rounded-2xl bg-[var(--color-surface-2)] p-5 border border-[var(--color-border)] transition-all hover:border-brand-blue/20">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-brand-blue">{item.t}</h4>
                    <p className="text-xs font-light text-[var(--color-text)]/50">{item.c}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-text)]/20 group-hover:translate-x-1 transition-transform" />
              </a>
            ))}
          </div>
        </section>

        {/* Support Bridge */}
        <section className="rounded-[3rem] border border-[var(--color-border)] bg-brand-dark p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <History className="h-40 w-40 text-brand-yellow" />
          </div>
          <header className="mb-8 border-b border-white/10 pb-6 relative z-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow/50 mb-2">Service Continuity</div>
            <h2 className="font-heading text-2xl text-white">Booking → Support Bridge</h2>
            <p className="mt-2 text-sm text-white/50 font-light">Qué revisar cuando el cierre ya pasó y ahora importa la entrega.</p>
          </header>

          <div className="grid gap-3 relative z-10">
            {[
              ['Confirmar Truth', 'Stripe e Invoice deben contar la misma historia.', '/admin/revenue'],
              ['Ver Support', 'Carga contexto bilingüe antes de hablar con el cliente.', '/admin/tickets'],
              ['Validar Assets', 'Calendar y Booking Page deben estar disponibles.', '/admin/qa'],
              ['Cuidar al Viajero', 'Protege la continuidad sin generar ruido innecesario.', '/admin/bookings'],
            ].map(([title, body, href]) => (
              <a key={title} href={href} className="rounded-2xl bg-white/5 p-5 border border-white/10 hover:bg-white/10 transition-all group">
                <h4 className="text-sm font-bold text-brand-yellow group-hover:text-white transition-colors">{title}</h4>
                <p className="text-xs font-light text-white/40 mt-1">{body}</p>
              </a>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4 bg-brand-yellow/10 border border-brand-yellow/20 p-5 rounded-[2rem] relative z-10">
             <AlertCircle className="h-5 w-5 text-brand-yellow shrink-0" />
             <p className="text-[11px] font-light leading-relaxed text-brand-yellow/80">
                <strong>Higiene Operativa:</strong> No reinicies discovery. Usa los datos del chat previo para resolver con precisión de guante blanco.
             </p>
          </div>
        </section>
      </div>

      {/* 03. RELEASE & SIMPLIFICATION (SUTILES) */}
      <div className="grid gap-6 md:grid-cols-2 opacity-60 hover:opacity-100 transition-opacity duration-500">
        <ReleaseGradeDeck compact title="Release-Grade Read" description="Valida la persistencia antes de escalar volumen." />
        <GoLiveSimplificationDeck compact title="Simplificación Ops" description="Fewer blocks, faster reading, obvious recovery." />
      </div>

      {/* 04. FOOTER DE ESTÁNDARES */}
      <footer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 transition-opacity hover:opacity-50">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <CreditCard className="h-3 w-3" /> Stripe Verified
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Map className="h-3 w-3" /> Delivery Ready
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3 w-3" /> Zero-Friction Compliance
        </div>
      </footer>
      
    </main>
  );
}