import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldCheck, 
  Sparkles, 
  Layers
} from 'lucide-react';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import AdminConversationsClient from './AdminConversationsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bandeja de Entrada | Admin KCE',
  description: 'Centro de triaje y enrutamiento de conversaciones para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/tickets', label: 'Cola de Soporte', tone: 'primary' as const },
  { href: '/admin/customers', label: 'Directorio Clientes' },
  { href: '/admin/ai/lab', label: 'AI Strategy' },
  { href: '/admin/command-center', label: 'Command Center' },
];

const focusItems = [
  {
    label: '01 · listen',
    title: 'Captura la señal fresca',
    body: 'Las conversaciones son la capa pura de demanda. Empieza por los hilos más recientes antes de que el interés del viajero se enfríe.',
    href: '/admin/tickets',
    cta: 'Abrir Soporte',
  },
  {
    label: '02 · classify',
    title: 'Triaje de alta velocidad',
    body: 'Clasifica rápido: ¿Es un Deal, un Ticket o Contexto? El valor de esta vista es la velocidad de enrutamiento, no el scroll infinito.',
    href: '/admin/customers',
    cta: 'Contexto Cliente',
  },
  {
    label: '03 · handoff',
    title: 'Handoff de Guante Blanco',
    body: 'Cuando el viajero escala de IA a Humano, la transición debe ser invisible. Mantén el contexto para no preguntar dos veces.',
    href: '/admin/ai/lab',
    cta: 'Revisar AI Desk',
  },
];

const notes = [
  {
    title: 'Prioridad 0',
    body: 'Hilos con intención de compra no resuelta mandan sobre el volumen de archivo.',
  },
  {
    title: 'Propiedad Clara',
    body: 'Cada hilo útil debe terminar con un dueño: Soporte, Ventas o Recuperación.',
  },
  {
    title: 'Éxito Operativo',
    body: 'Un buen escritorio de mensajes parece un centro de mando, no una arqueología de chats.',
  },
];

export default function AdminConversationsPage() {
  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CAPA ESTRATÉGICA (OPERATING READ) 
          Eliminamos el header redundante; el AdminExecutivePanel ya establece el contexto.
      */}
      <section className="pt-4">
        <AdminExecutivePanel
          eyebrow="conversation operating read"
          title="Triaje de señales antes de que sea ruido"
          description="Este panel prioriza la lectura rápida de hilos calientes. Tu misión es clasificar cada conversación en su carril correspondiente de forma quirúrgica."
          quickLinks={quickLinks}
          focusItems={focusItems}
          notes={notes}
        />
      </section>

      {/* 02. RELEASE DECKS (INFRAESTRUCTURA Y SOPs) */}
      <div className="grid gap-6 md:grid-cols-2 opacity-70 hover:opacity-100 transition-opacity duration-500">
        <ReleaseGradeDeck
          compact
          title="Release-Grade Quality"
          description="Asegura que el historial de mensajes y el handoff de IA se mantengan conectados a una sola historia de cliente."
        />
        <GoLiveSimplificationDeck
          compact
          title="Decisión Operativa"
          description="Menos ruido visual, colas más claras y enrutamiento más rápido hacia el dueño del caso."
        />
      </div>

      {/* 03. MONITOR MAESTRO (CLIENTE INTERACTIVO) 
          Delegamos el Header Táctico y los Filtros al componente de cliente.
      */}
      <section className="relative">
        {/* Acento visual de integridad */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        <AdminConversationsClient />
      </section>

      {/* FOOTER DE ESTÁNDARES */}
      <footer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> GDPR & Privacy Compliant
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Routing Layer v2.1
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Intelligence unit active
        </div>
      </footer>
      
    </main>
  );
}