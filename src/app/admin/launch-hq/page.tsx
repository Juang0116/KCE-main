import 'server-only';
import type { Metadata } from 'next';
import { 
  Rocket, ShieldCheck, BarChart3, 
  Terminal, Activity, Command, Eye,
  Sparkles, Layers
} from 'lucide-react';

import ExecutiveLaunchHQDeck from '@/components/admin/ExecutiveLaunchHQDeck';
import WorldClassGoLiveDeck from '@/components/admin/WorldClassGoLiveDeck';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Launch HQ | Centro de Mando KCE',
  description: 'Cuartel general ejecutivo para la gestión de lanzamientos y escalado operativo de Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/command-center', label: 'Command Center', icon: Command },
  { href: '/admin/qa', label: 'QA Truth', icon: ShieldCheck },
  { href: '/admin/revenue', label: 'Revenue Truth', tone: 'primary' as const, icon: BarChart3 },
  { href: '/admin/marketing', label: 'Marketing Desk' },
  { href: '/admin/deals', label: 'Sales Pipeline' },
];

const focusItems = [
  {
    label: '01 · verify',
    title: 'Validar integridad del núcleo',
    body: 'Si el checkout, la persistencia de reservas y los activos de entrega no coinciden, detén el tráfico y corrige la brecha de datos.',
    href: '/admin/qa',
    cta: 'Verificar Sistema',
  },
  {
    label: '02 · decide',
    title: 'Presión de tráfico selectivo',
    body: 'Escala únicamente el canal de ventas que se mantenga premium, calificado y operacionalmente recuperable en este nodo.',
    href: '/admin/marketing',
    cta: 'Elegir Canal',
  },
  {
    label: '03 · protect',
    title: 'Blindar la calma post-pago',
    body: 'Las reservas y el soporte deben ser infalibles tras la conversión para que la promesa premium de KCE se mantenga intacta.',
    href: '/admin/bookings',
    cta: 'Proteger Reservas',
  },
];

const notes = [
  {
    title: 'Escalar hoy',
    body: 'Solo escala la vía que tenga adquisición limpia y autoridad de cierre clara.',
  },
  {
    title: 'Proteger hoy',
    body: 'Si la verdad del revenue o la entrega flaquean, la estabilidad importa más que el tráfico.',
  },
  {
    title: 'Listo esta noche',
    body: 'Deja una vía protegida para que mañana el nodo abra con mayor velocidad y calma.',
  },
];

export default function LaunchHqPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. NODO DE IDENTIFICACIÓN TÉCNICA */}
      <div className="flex items-center justify-between px-2 opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
            High-Consequence Lane: /launch-hq
          </span>
        </div>
        <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-4 py-1.5 rounded-full">
           <Activity className="h-3 w-3 text-brand-blue animate-pulse" />
           <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-tighter">
             Launch Readiness: Nominal
           </span>
        </div>
      </div>

      {/* 02. PANEL EJECUTIVO DE DECISIONES 
          Este es el corazón de la página. Centraliza la visión y las acciones.
      */}
      <section className="relative">
        <AdminExecutivePanel
          eyebrow="launch headquarters"
          title="Comando central de operaciones de mercado"
          description="Unidad ejecutiva de despacho. Verifica la integridad de los datos, decide el canal de presión y asegura la experiencia premium de KCE."
          quickLinks={quickLinks}
          focusItems={focusItems}
          notes={notes}
        />
      </section>

      {/* 03. ESTRATEGIA Y SIMPLIFICACIÓN (DECKS) */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
           <ExecutiveLaunchHQDeck 
             compact 
             description="Define dónde inyectar demanda hoy, qué carriles necesitan protección y qué confirmar antes del escalado." 
           />
           <WorldClassGoLiveDeck 
             compact 
             title="Go-live final read" 
             description="Un lanzamiento sólido requiere que el crecimiento y el soporte estén coordinados al 100%." 
           />
        </div>

        <div className="space-y-8">
           <GoLiveSimplificationDeck
             compact
             title="Simplify launch operations"
             description="Claridad absoluta: menos paneles para escanear y un camino de recuperación obvio ante cualquier fricción."
           />
           
           {/* Widget de Vigilancia de Calidad */}
           <div className="rounded-[3rem] border border-[var(--color-border)] bg-brand-dark p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                <Rocket className="h-40 w-40 text-brand-blue" />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow">
                    <Eye className="h-4 w-4" /> Integrity Monitor
                 </div>
                 <h3 className="font-heading text-2xl">Vigilancia de Calidad</h3>
                 <p className="text-sm font-light text-white/60 leading-relaxed max-w-md italic">
                   &quot;Si el rastro de revenue o la persistencia de reservas muestra anomalías, 
                   prioriza la estabilidad del sistema sobre el volumen de ventas masivo.&quot;
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* 04. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Protocol
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Premium Scale Authorized
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> HQ Node v4.0
        </div>
      </footer>
      
    </main>
  );
}