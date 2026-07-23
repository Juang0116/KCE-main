/* src/components/admin/AdminExecutivePanel.tsx */
'use client';

import React from 'react';
import {
  BarChart3,
  Download,
  Plus,
  TrendingUp,
  Activity,
  Target,
  Clock,
  ArrowUpRight,
  Users,
  Globe2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardSubtitle,
} from '@/components/admin/AdminCard';
import { Button } from '@/components/ui/Button';

export default function AdminExecutivePanel() {
  return (
    <div className="space-y-12 pb-20">
      {/* 01. ENCABEZADO DE MANDO */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Operations Command
          </div>
          <h1 className="font-heading text-4xl leading-tight tracking-tighter text-main md:text-5xl">
            Executive{' '}
            <span className="font-light italic text-brand-yellow opacity-90">Overview</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg font-light text-muted">
            Centro de mando institucional de{' '}
            <span className="font-medium text-main">Knowing Cultures S.A.S.</span> Monitoreo en
            tiempo real de expediciones y conversiones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-6 text-[10px] font-bold uppercase tracking-widest text-main shadow-sm transition-all hover:bg-surface-2"
          >
            <Download className="mr-2 h-4 w-4" /> Reporte Mensual
          </Button>
          <Button className="h-12 rounded-full bg-brand-blue px-8 text-[10px] font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-brand-dark">
            <Plus className="mr-2 h-4 w-4" /> Crear Experiencia
          </Button>
        </div>
      </header>

      {/* 02. KPIS MAESTROS (Diseño Blindado) */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {[
          {
            label: 'Reservas Activas',
            value: '142',
            trend: '+12%',
            icon: BarChart3,
            color: 'text-brand-blue',
            bg: 'bg-brand-blue/5',
          },
          {
            label: 'Ingresos (USD)',
            value: '$24.5k',
            trend: '+5.4%',
            icon: Globe2,
            color: 'text-brand-terra',
            bg: 'bg-brand-terra/5',
          },
          {
            label: 'Rating Global',
            value: '4.92',
            trend: 'Estable',
            icon: ShieldCheck,
            color: 'text-brand-yellow',
            bg: 'bg-brand-yellow/5',
          },
        ].map((kpi, idx) => (
          <AdminCard
            key={idx}
            hoverEffect
            className="group relative overflow-hidden border-brand-dark/5 p-8 shadow-pop dark:border-white/10 md:p-10"
          >
            <div
              className={`absolute right-0 top-0 p-6 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 ${kpi.color}`}
            >
              <kpi.icon className="h-24 w-24" />
            </div>
            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                  {kpi.label}
                </span>
                <div className={`rounded-xl p-2 ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span
                  className={`font-heading text-5xl font-bold tracking-tighter ${idx === 0 ? 'text-main' : kpi.color}`}
                >
                  {kpi.value}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${kpi.trend.includes('+') ? 'border-green-100 bg-green-50 text-green-600' : 'border-brand-dark/5 bg-surface-2 text-muted'}`}
                >
                  {kpi.trend}
                </span>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* 03. SECCIÓN OPERATIVA: RENDIMIENTO Y LOGS */}
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_400px]">
        {/* Gráfico de Rendimiento */}
        <AdminCard className="border-brand-dark/5 p-8 shadow-soft md:p-12">
          <AdminCardHeader className="mb-10">
            <AdminCardTitle className="font-heading text-2xl tracking-tight">
              Rendimiento por Territorio
            </AdminCardTitle>
            <AdminCardSubtitle>
              Reservas consolidadas en los últimos 30 días de operación.
            </AdminCardSubtitle>
          </AdminCardHeader>
          <div className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[2rem] border border-brand-dark/5 bg-surface-2">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/[0.02] to-transparent" />
            <div className="flex flex-col items-center text-center opacity-30 transition-opacity duration-700 group-hover:opacity-100">
              <Activity className="mb-4 h-12 w-12 animate-pulse text-brand-blue" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-main">
                Sincronizando Data Analítica...
              </span>
            </div>
          </div>
        </AdminCard>

        {/* Flujo de Actividad (Log de Autor) */}
        <AdminCard className="bg-surface-2/50 flex flex-col border-brand-dark/5 p-8 shadow-soft backdrop-blur-sm">
          <header className="mb-10 flex items-center justify-between">
            <h3 className="font-heading text-xl tracking-tight text-main">Activity Stream</h3>
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          </header>

          <div className="flex-1 space-y-6">
            {[
              {
                title: 'Nueva Reserva: Medellín',
                desc: 'Carlos R. • Tour Pablo Escobar',
                time: '5m',
                dot: 'bg-brand-blue',
              },
              {
                title: 'Pago Verificado',
                desc: 'Stripe ID: ch_3P... (450€)',
                time: '22m',
                dot: 'bg-green-500',
              },
              {
                title: 'Alerta de Concierge',
                desc: 'Elena solicita cambio de fecha',
                time: '1h',
                dot: 'bg-brand-yellow',
              },
              {
                title: 'Nuevo Lead VIP',
                desc: 'Interés en expedición privada',
                time: '3h',
                dot: 'bg-brand-terra',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-transparent p-4 transition-all duration-300 hover:border-brand-dark/5 hover:bg-surface"
              >
                <div
                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${item.dot} shadow-sm transition-transform group-hover:scale-150`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-main transition-colors group-hover:text-brand-blue">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">{item.desc}</p>
                </div>
                <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-[9px] text-muted opacity-60 transition-colors group-hover:bg-brand-dark group-hover:text-white">
                  {item.time}
                </span>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            className="mt-10 w-full text-[10px] font-bold uppercase tracking-widest text-muted transition-colors hover:text-brand-blue"
          >
            Ver Auditoría Completa <ArrowUpRight className="ml-2 h-3 w-3" />
          </Button>
        </AdminCard>
      </div>
    </div>
  );
}
