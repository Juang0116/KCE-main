/* src/app/(marketing)/account/activity/page.tsx */
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
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
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
    color: 'text-brand-blue',
    bg: 'bg-brand-yellow/10 border-brand-yellow/20',
    link: '/account/plans/456'
  }
];

export default function ActivityCenterView() {
  return (
    <div className="w-full max-w-[var(--container-max)] mx-auto px-6 py-12 md:py-20 animate-fade-in">
      
      {/* 01. HEADER DEL DASHBOARD */}
      <header className="mb-12 border-b border-brand-dark/10 dark:border-white/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 dark:border-white/10 bg-surface-2/50 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
            <Activity className="h-3 w-3" /> Panel de Viajero
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
            Tu Actividad
          </h1>
          <p className="mt-4 text-muted font-light text-base md:text-lg max-w-xl leading-relaxed">
            Sigue el rastro de tus próximas aventuras, consultas con nuestro equipo y experiencias guardadas.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full bg-surface hover:bg-surface-2 border-brand-dark/10 dark:border-white/10 text-main text-xs font-bold uppercase tracking-widest h-12 px-6 shadow-sm shrink-0 transition-transform hover:-translate-y-1">
          <Link href="/tours">Explorar más tours</Link>
        </Button>
      </header>

      <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
        
        {/* 02. TIMELINE DE ACTIVIDAD (Seamless List Premium) */}
        <div className="rounded-[var(--radius-2xl)] bg-surface border border-brand-dark/10 dark:border-white/10 shadow-soft overflow-hidden p-8 md:p-12">
          <h2 className="font-heading text-2xl text-main mb-10 tracking-tight">Historial Reciente</h2>
          
          {ACTIVITY_FEED.length > 0 ? (
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[1.4rem] before:h-full before:w-px before:bg-gradient-to-b before:from-brand-dark/10 dark:before:from-white/10 before:to-transparent">
              {ACTIVITY_FEED.map((item) => (
                <div key={item.id} className="relative z-10 flex items-start gap-6 group py-4">
                  {/* Icono del Timeline */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-surface ${item.bg} ${item.color} shadow-sm transition-transform duration-300 group-hover:scale-110 z-10`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  
                  {/* Tarjeta de Contenido */}
                  <Link href={item.link} className="flex-1 bg-surface-2/50 p-6 rounded-[var(--radius-xl)] border border-brand-dark/5 dark:border-white/5 hover:bg-surface hover:border-brand-blue/30 hover:shadow-soft transition-all duration-300 group-hover:-translate-y-1 block">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <h3 className="font-heading text-lg text-main tracking-tight group-hover:text-brand-blue transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-80 shrink-0">
                        {item.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-5 border-t border-brand-dark/5 dark:border-white/5 pt-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${item.color}`}>
                        {item.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted opacity-30 group-hover:opacity-100 group-hover:text-brand-blue transition-all duration-300 group-hover:translate-x-1" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State Elegante */
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-surface-2 border border-brand-dark/5 dark:border-white/5 flex items-center justify-center mb-6 shadow-sm">
                <Compass className="h-8 w-8 text-muted opacity-50 animate-pulse" />
              </div>
              <h3 className="font-heading text-2xl text-main mb-3 tracking-tight">Aún no hay actividad</h3>
              <p className="text-base text-muted font-light max-w-sm mb-8 leading-relaxed">Tu diario de viaje está en blanco. Empieza explorando nuestro catálogo o armando un plan a tu medida.</p>
              <Button asChild className="rounded-full bg-brand-blue text-white shadow-pop transition-transform hover:-translate-y-1 text-xs font-bold uppercase tracking-widest px-8 py-6">
                <Link href="/tours">Descubrir Experiencias</Link>
              </Button>
            </div>
          )}
        </div>

        {/* 03. SIDEBAR DE CUENTA (Glassmorphism Concierge) */}
        <aside className="space-y-6">
          <div className="rounded-[var(--radius-2xl)] border border-brand-dark/10 dark:border-white/10 bg-surface p-8 shadow-soft relative overflow-hidden group hover:shadow-pop transition-all duration-500">
            <div className="absolute -right-10 -bottom-10 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 pointer-events-none">
              <ShieldCheck className="h-48 w-48 text-brand-blue" />
            </div>
            
            <div className="relative z-10">
              <h3 className="font-heading text-2xl text-main tracking-tight mb-4 group-hover:text-brand-blue transition-colors">Soporte Concierge</h3>
              <p className="text-sm font-light text-muted mb-8 leading-relaxed">
                ¿Tienes dudas sobre una reserva o quieres ajustar tu plan? Tu equipo de soporte está disponible.
              </p>
              <Button asChild className="w-full rounded-full bg-green-600 text-white hover:bg-green-700 shadow-pop transition-transform hover:-translate-y-1 text-xs font-bold uppercase tracking-widest py-6">
                <Link href="/contact">Hablar por WhatsApp</Link>
              </Button>
            </div>
          </div>

          {/* Enlaces Rápidos Premium */}
          <div className="rounded-[var(--radius-2xl)] border border-brand-dark/10 dark:border-white/10 bg-surface-2 p-8 shadow-inner">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
              <Activity className="h-3 w-3" /> Enlaces Rápidos
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/account/profile" className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-brand-dark/5 dark:border-white/5 hover:border-brand-blue/30 hover:shadow-sm transition-all text-sm font-medium text-main tracking-tight group">
                  Mi Perfil <ArrowRight className="h-4 w-4 text-muted opacity-50 group-hover:opacity-100 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
                </Link>
              </li>
              <li>
                <Link href="/account/bookings" className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-brand-dark/5 dark:border-white/5 hover:border-brand-blue/30 hover:shadow-sm transition-all text-sm font-medium text-main tracking-tight group">
                  Mis Reservas <ArrowRight className="h-4 w-4 text-muted opacity-50 group-hover:opacity-100 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
                </Link>
              </li>
              <li className="pt-2">
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-600 transition-all text-xs font-bold uppercase tracking-widest text-muted group">
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