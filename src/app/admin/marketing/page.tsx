// src/app/admin/marketing/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  Megaphone, Zap, BarChart3, Target, 
  Terminal, ShieldCheck, Sparkles, 
  Layers, MousePointer2, TrendingUp 
} from 'lucide-react';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminMarketingClient } from './AdminMarketingClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marketing Vault | Crecimiento KCE',
  description: 'Unidad de atribución de campañas y optimización de demanda para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/revenue', label: 'Revenue Truth', tone: 'primary' as const },
  { href: '/admin/sales', label: 'Sales Handoff' },
  { href: '/admin/templates', label: 'Message System' },
  { href: '/admin/command-center', label: 'Command Center' },
];

const focusItems = [
  {
    label: '01 · push',
    title: 'Escalar canales de cierre',
    body: 'Inyecta tráfico solo donde la ruta hacia el quiz y el checkout mantenga la calidad premium sin degradar la conversión.',
    href: '/admin/revenue',
    cta: 'Verificar Revenue',
  },
  {
    label: '02 · fix',
    title: 'Reparar cuellos de botella',
    body: 'Si la captura de leads o la continuidad del CTA flaquea, ajusta el sistema de mensajes antes de compensar con más volumen.',
    href: '/admin/templates',
    cta: 'Ajustar Mensajes',
  },
  {
    label: '03 · align',
    title: 'Coherencia de narrativa',
    body: 'Desde el primer clic hasta el pago, el viajero debe escuchar la misma historia premium. Alinea el lenguaje de marketing con ventas.',
    href: '/admin/sales',
    cta: 'Sales Handoff',
  },
];

const notes = [
  {
    title: 'Escalar hoy',
    body: 'Escala la vía que convierte con intención limpia, no la que solo infla el volumen de visitas en el dashboard.',
  },
  {
    title: 'Blindar hoy',
    body: 'Protege la continuidad del CTA desde el descubrimiento hasta el checkout antes de añadir complejidad a las campañas.',
  },
  {
    title: 'Publicar hoy',
    body: 'Lanza contenido que refuerce un canal ganador o repare un handoff débil, no volumen genérico sin propósito comercial.',
  },
];

export default async function AdminMarketingPage() {
  await requireAdmin();

  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE CONTROL DE DEMANDA */}
      <section className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8 px-2">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
              <Terminal className="h-3.5 w-3.5" /> Operations Lane: /growth-vault
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
              Marketing <span className="text-brand-yellow italic font-light">& Atribución</span>
            </h1>
            <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic">
              Unidad de despacho de demanda internacional. Detecta señales de alta conversión, repara fricciones 
              técnicas y alinea el crecimiento con la Verdad del Revenue.
            </p>
          </div>

          {/* Status de Pulso de Mercado */}
          <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-6 py-3 rounded-2xl shadow-inner">
             <div className="relative">
                <TrendingUp className="h-5 w-5 text-brand-blue" />
                <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-yellow animate-pulse" />
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Growth Signal</p>
                <p className="text-[9px] font-mono text-brand-blue/40 uppercase">Attribution Node Active</p>
             </div>
          </div>
        </header>

        <AdminExecutivePanel
          eyebrow="marketing operating read"
          title="Escritorio ejecutivo para demanda calificada"
          description="Este panel prioriza la toma de decisiones basada en datos: identifica qué canal tiene señal, soluciona el verdadero cuello de botella y asegura la coherencia narrativa."
          quickLinks={quickLinks}
          focusItems={focusItems}
          notes={notes}
        />
      </section>

      {/* 02. DECKS DE INFRAESTRUCTURA DE CRECIMIENTO */}
      <div className="grid gap-6 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity duration-500">
        <ReleaseGradeDeck
          compact
          title="Release-Grade Growth"
          description="Asegura que la captura de leads y la continuidad del checkout refuercen el estándar premium de KCE antes de escalar tráfico."
        />
        <GoLiveSimplificationDeck
          compact
          title="Simplificación de Funnel"
          description="Velocidad de decisión: lectura limpia del embudo y acciones inmediatas para optimizar el retorno de inversión."
        />
      </div>

      {/* 03. TERMINAL DE MÉTRICAS (CLIENTE INTERACTIVO) */}
      <section className="relative pt-8">
        <div className="mb-8 flex items-center justify-between px-4">
           <div className="flex items-center gap-4">
             <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
                <Megaphone className="h-6 w-6" />
             </div>
             <h2 className="font-heading text-3xl text-brand-blue">Monitor de Performance</h2>
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
              <Zap className="h-3.5 w-3.5 animate-pulse text-brand-yellow" /> Live Market Signal
           </div>
        </div>
        
        {/* Acento lateral de integridad */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente maneja las métricas UTM, CTAs y el Funnel */}
        <AdminMarketingClient />
      </section>

      {/* FOOTER DE SOBERANÍA COMERCIAL */}
      <footer className="mt-16 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Growth Data
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Growth Engine v3.2
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Demand Intelligence Active
        </div>
      </footer>
      
    </main>
  );
}