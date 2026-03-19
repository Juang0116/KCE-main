'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Activity, 
  MapPin, 
  MessageSquare, 
  CalendarDays, 
  Heart, 
  ArrowRight, 
  ShieldCheck,
  Compass
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

// Datos simulados (Aquí irían los datos reales de tu base de datos/backend)
const ACTIVITY_FEED = [
  {
    id: 1,
    type: 'booking',
    title: 'Reserva Confirmada: Eje Cafetero Profundo',
    date: 'Hoy, 10:30 AM',
    status: 'Completado',
    icon: CalendarDays,
    color: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success)]/10 border-[var(--color-success)]/20',
    link: '/account/bookings/123'
  },
  {
    id: 2,
    type: 'support',
    title: 'Consulta con Concierge (WhatsApp)',
    date: 'Ayer, 04:15 PM',
    status: 'En curso',
    icon: MessageSquare,
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/10 border-brand-blue/20',
    link: '/contact'
  },
  {
    id: 3,
    type: 'wishlist',
    title: 'Guardaste "Tour de Café en Medellín"',
    date: 'Hace 3 días',
    status: 'Guardado',
    icon: Heart,
    color: 'text-brand-terra',
    bg: 'bg-brand-terra/10 border-brand-terra/20',
    link: '/tours/tour-de-cafe-medellin'
  },
  {
    id: 4,
    type: 'plan',
    title: 'Solicitud de Plan Personalizado',
    date: '12 Mar 2026',
    status: 'Entregado',
    icon: Compass,
    color: 'text-brand-yellow',
    bg: 'bg-brand-yellow/10 border-brand-yellow/20',
    link: '/account/plans/456'
  }
];

export default function ActivityCenterView() {
  return (
    <div className="w-full max-w-[var(--container-max)] mx-auto px-6 py-12 md:py-20 animate-fade-in">
      
      {/* 01. HEADER DEL DASHBOARD */}
      <header className="mb-12 border-b border-[var(--color-border)] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
            <Activity className="h-3 w-3" /> Panel de Viajero
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-[var(--color-text)] tracking-tight">
            Tu Actividad
          </h1>
          <p className="mt-3 text-[var(--color-text-muted)] font-light text-base md:text-lg max-w-xl">
            Sigue el rastro de tus próximas aventuras, consultas con nuestro equipo y experiencias guardadas.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)] shadow-sm shrink-0">
          <Link href="/tours">Explorar más tours</Link>
        </Button>
      </header>

      <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
        
        {/* 02. TIMELINE DE ACTIVIDAD (Seamless List) */}
        <div className="rounded-[var(--radius-2xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft overflow-hidden p-6 md:p-10">
          <h2 className="font-heading text-2xl text-[var(--color-text)] mb-8">Historial Reciente</h2>
          
          {ACTIVITY_FEED.length > 0 ? (
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[1.3rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--color-border)] before:to-transparent">
              {ACTIVITY_FEED.map((item) => (
                <div key={item.id} className="relative z-10 flex items-start gap-6 group py-4">
                  {/* Icono del Timeline */}
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-[var(--color-surface)] ${item.bg} ${item.color} shadow-sm transition-transform duration-300 group-hover:scale-110 z-10`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  
                  {/* Tarjeta de Contenido */}
                  <Link href={item.link} className="flex-1 bg-[var(--color-surface-2)]/50 p-5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-brand-blue/30 hover:shadow-sm transition-all group-hover:-translate-y-0.5 block">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <h3 className="font-heading text-lg text-[var(--color-text)] group-hover:text-brand-blue transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-70 shrink-0">
                        {item.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4 border-t border-[var(--color-border)] pt-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${item.color}`}>
                        {item.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] opacity-30 group-hover:opacity-100 group-hover:text-brand-blue transition-all group-hover:translate-x-1" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
                <Compass className="h-8 w-8 text-[var(--color-text-muted)] opacity-30" />
              </div>
              <h3 className="font-heading text-xl text-[var(--color-text)] mb-2">Aún no hay actividad</h3>
              <p className="text-sm text-[var(--color-text-muted)] font-light max-w-sm mb-6">Tu diario de viaje está en blanco. Empieza explorando nuestro catálogo o armando un plan.</p>
              <Button asChild className="rounded-full bg-brand-blue text-white shadow-pop">
                <Link href="/tours">Descubrir Experiencias</Link>
              </Button>
            </div>
          )}
        </div>

        {/* 03. SIDEBAR DE CUENTA (Glassmorphism Concierge) */}
        <aside className="space-y-6">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl p-8 shadow-soft relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 opacity-[0.03] transition-transform duration-700 group-hover:scale-125">
              <ShieldCheck className="h-48 w-48 text-brand-blue" />
            </div>
            
            <div className="relative z-10">
              <h3 className="font-heading text-xl text-[var(--color-text)] mb-6">Soporte Concierge</h3>
              <p className="text-sm font-light text-[var(--color-text-muted)] mb-6 leading-relaxed">
                ¿Tienes dudas sobre una reserva o quieres ajustar tu plan? Tu equipo de soporte está disponible.
              </p>
              <Button asChild className="w-full rounded-full bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/90 shadow-md transition-transform hover:-translate-y-0.5">
                <Link href="/contact">Hablar por WhatsApp</Link>
              </Button>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/30 p-6 shadow-inner">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/account/profile" className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-surface)] hover:shadow-sm transition-all text-sm font-medium text-[var(--color-text)] group">
                  Mi Perfil <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              </li>
              <li>
                <Link href="/account/bookings" className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-surface)] hover:shadow-sm transition-all text-sm font-medium text-[var(--color-text)] group">
                  Mis Reservas <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              </li>
              <li>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 transition-all text-sm font-medium text-[var(--color-text-muted)] group">
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </aside>

      </div>
    </div>
  );
}