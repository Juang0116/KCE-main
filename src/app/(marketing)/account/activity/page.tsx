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
  Compass,
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
    link: '/account/bookings/123',
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
    link: '/contact',
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
    link: '/tours/tour-de-cafe-medellin',
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
    link: '/account/plans/456',
  },
];

export default function ActivityCenterView() {
  return (
    <div className="mx-auto w-full max-w-[var(--container-max)] animate-fade-in px-6 py-12 md:py-20">
      {/* 01. HEADER DEL DASHBOARD */}
      <header className="mb-12 flex flex-col justify-between gap-6 border-b border-brand-dark/10 pb-8 dark:border-white/10 md:flex-row md:items-end">
        <div>
          <div className="bg-surface-2/50 mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm dark:border-white/10">
            <Activity className="h-3 w-3" /> Panel de Viajero
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Tu Actividad
          </h1>
          <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted md:text-lg">
            Sigue el rastro de tus próximas aventuras, consultas con nuestro equipo y experiencias
            guardadas.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-12 shrink-0 rounded-full border-brand-dark/10 bg-surface px-6 text-xs font-bold uppercase tracking-widest text-main shadow-sm transition-transform hover:-translate-y-1 hover:bg-surface-2 dark:border-white/10"
        >
          <Link href="/tours">Explorar más tours</Link>
        </Button>
      </header>

      <div className="grid items-start gap-12 lg:grid-cols-[1fr_350px]">
        {/* 02. TIMELINE DE ACTIVIDAD (Seamless List Premium) */}
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface p-8 shadow-soft dark:border-white/10 md:p-12">
          <h2 className="mb-10 font-heading text-2xl tracking-tight text-main">
            Historial Reciente
          </h2>

          {ACTIVITY_FEED.length > 0 ? (
            <div className="relative space-y-0 before:absolute before:inset-0 before:ml-[1.4rem] before:h-full before:w-px before:bg-gradient-to-b before:from-brand-dark/10 before:to-transparent dark:before:from-white/10">
              {ACTIVITY_FEED.map((item) => (
                <div
                  key={item.id}
                  className="group relative z-10 flex items-start gap-6 py-4"
                >
                  {/* Icono del Timeline */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-surface ${item.bg} ${item.color} z-10 shadow-sm transition-transform duration-300 group-hover:scale-110`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>

                  {/* Tarjeta de Contenido */}
                  <Link
                    href={item.link}
                    className="bg-surface-2/50 block flex-1 rounded-[var(--radius-xl)] border border-brand-dark/5 p-6 transition-all duration-300 hover:border-brand-blue/30 hover:bg-surface hover:shadow-soft group-hover:-translate-y-1 dark:border-white/5"
                  >
                    <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <h3 className="font-heading text-lg tracking-tight text-main transition-colors group-hover:text-brand-blue">
                        {item.title}
                      </h3>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted opacity-80">
                        {item.date}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-brand-dark/5 pt-4 dark:border-white/5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${item.color}`}
                      >
                        {item.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted opacity-30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-blue group-hover:opacity-100" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State Elegante */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 shadow-sm dark:border-white/5">
                <Compass className="h-8 w-8 animate-pulse text-muted opacity-50" />
              </div>
              <h3 className="mb-3 font-heading text-2xl tracking-tight text-main">
                Aún no hay actividad
              </h3>
              <p className="mb-8 max-w-sm text-base font-light leading-relaxed text-muted">
                Tu diario de viaje está en blanco. Empieza explorando nuestro catálogo o armando un
                plan a tu medida.
              </p>
              <Button
                asChild
                className="rounded-full bg-brand-blue px-8 py-6 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-transform hover:-translate-y-1"
              >
                <Link href="/tours">Descubrir Experiencias</Link>
              </Button>
            </div>
          )}
        </div>

        {/* 03. SIDEBAR DE CUENTA (Glassmorphism Concierge) */}
        <aside className="space-y-6">
          <div className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface p-8 shadow-soft transition-all duration-500 hover:shadow-pop dark:border-white/10">
            <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.03] transition-transform duration-700 group-hover:scale-125">
              <ShieldCheck className="h-48 w-48 text-brand-blue" />
            </div>

            <div className="relative z-10">
              <h3 className="mb-4 font-heading text-2xl tracking-tight text-main transition-colors group-hover:text-brand-blue">
                Soporte Concierge
              </h3>
              <p className="mb-8 text-sm font-light leading-relaxed text-muted">
                ¿Tienes dudas sobre una reserva o quieres ajustar tu plan? Tu equipo de soporte está
                disponible.
              </p>
              <Button
                asChild
                className="w-full rounded-full bg-green-600 py-6 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-transform hover:-translate-y-1 hover:bg-green-700"
              >
                <Link href="/contact">Hablar por WhatsApp</Link>
              </Button>
            </div>
          </div>

          {/* Enlaces Rápidos Premium */}
          <div className="rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface-2 p-8 shadow-inner dark:border-white/10">
            <h4 className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
              <Activity className="h-3 w-3" /> Enlaces Rápidos
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/account/profile"
                  className="group flex items-center justify-between rounded-xl border border-brand-dark/5 bg-surface px-4 py-3 text-sm font-medium tracking-tight text-main transition-all hover:border-brand-blue/30 hover:shadow-sm dark:border-white/5"
                >
                  Mi Perfil{' '}
                  <ArrowRight className="h-4 w-4 text-muted opacity-50 transition-all group-hover:translate-x-1 group-hover:text-brand-blue group-hover:opacity-100" />
                </Link>
              </li>
              <li>
                <Link
                  href="/account/bookings"
                  className="group flex items-center justify-between rounded-xl border border-brand-dark/5 bg-surface px-4 py-3 text-sm font-medium tracking-tight text-main transition-all hover:border-brand-blue/30 hover:shadow-sm dark:border-white/5"
                >
                  Mis Reservas{' '}
                  <ArrowRight className="h-4 w-4 text-muted opacity-50 transition-all group-hover:translate-x-1 group-hover:text-brand-blue group-hover:opacity-100" />
                </Link>
              </li>
              <li className="pt-2">
                <button className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted transition-all hover:bg-red-500/10 hover:text-red-600">
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
