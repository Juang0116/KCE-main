/* src/components/admin/AdminExecutivePanel.tsx */
'use client';

import React from 'react';
import { 
  BarChart3, Download, Plus, TrendingUp, 
  Activity, Target, Clock, ArrowUpRight, 
  Users, Globe2, Sparkles, ShieldCheck
} from 'lucide-react';
import { 
  AdminCard, AdminCardHeader, AdminCardTitle, AdminCardSubtitle 
} from '@/components/admin/AdminCard';
import { Button } from '@/components/ui/Button';

export default function AdminExecutivePanel() {
  return (
    <div className="space-y-12 pb-20">
      
      {/* 01. ENCABEZADO DE MANDO */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-blue/5 border border-brand-blue/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Operations Command
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tighter leading-tight">
            Executive <span className="text-brand-yellow font-light italic opacity-90">Overview</span>
          </h1>
          <p className="mt-3 text-lg font-light text-muted max-w-2xl">
            Centro de mando institucional de <span className="text-main font-medium">Knowing Cultures S.A.S.</span> Monitoreo en tiempo real de expediciones y conversiones.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" className="rounded-full border-brand-dark/10 text-main hover:bg-surface-2 h-12 px-6 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Reporte Mensual
          </Button>
          <Button className="rounded-full bg-brand-blue text-white hover:bg-brand-dark h-12 px-8 text-[10px] font-bold uppercase tracking-widest transition-all shadow-pop">
            <Plus className="w-4 h-4 mr-2" /> Crear Experiencia
          </Button>
        </div>
      </header>

      {/* 02. KPIS MAESTROS (Diseño Blindado) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Reservas Activas', value: '142', trend: '+12%', icon: BarChart3, color: 'text-brand-blue', bg: 'bg-brand-blue/5' },
          { label: 'Ingresos (USD)', value: '$24.5k', trend: '+5.4%', icon: Globe2, color: 'text-brand-terra', bg: 'bg-brand-terra/5' },
          { label: 'Rating Global', value: '4.92', trend: 'Estable', icon: ShieldCheck, color: 'text-brand-yellow', bg: 'bg-brand-yellow/5' },
        ].map((kpi, idx) => (
          <AdminCard key={idx} hoverEffect className="group p-8 md:p-10 border-brand-dark/5 dark:border-white/10 shadow-pop relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-6 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 ${kpi.color}`}>
               <kpi.icon className="h-24 w-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">{kpi.label}</span>
                 <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                   <kpi.icon className="w-4 h-4" />
                 </div>
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-5xl font-heading font-bold tracking-tighter ${idx === 0 ? 'text-main' : kpi.color}`}>
                  {kpi.value}
                </span>
                <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${kpi.trend.includes('+') ? 'text-green-600 bg-green-50 border-green-100' : 'text-muted bg-surface-2 border-brand-dark/5'}`}>
                  {kpi.trend}
                </span>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* 03. SECCIÓN OPERATIVA: RENDIMIENTO Y LOGS */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
        
        {/* Gráfico de Rendimiento */}
        <AdminCard className="p-8 md:p-12 border-brand-dark/5 shadow-soft">
          <AdminCardHeader className="mb-10">
            <AdminCardTitle className="text-2xl font-heading tracking-tight">Rendimiento por Territorio</AdminCardTitle>
            <AdminCardSubtitle>Reservas consolidadas en los últimos 30 días de operación.</AdminCardSubtitle>
          </AdminCardHeader>
          <div className="relative aspect-[16/9] w-full rounded-[2rem] bg-surface-2 border border-brand-dark/5 flex items-center justify-center group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/[0.02] to-transparent" />
             <div className="text-center flex flex-col items-center opacity-30 group-hover:opacity-100 transition-opacity duration-700">
                <Activity className="w-12 h-12 text-brand-blue mb-4 animate-pulse" />
                <span className="text-xs font-bold tracking-[0.3em] uppercase text-main">Sincronizando Data Analítica...</span>
             </div>
          </div>
        </AdminCard>

        {/* Flujo de Actividad (Log de Autor) */}
        <AdminCard className="p-8 border-brand-dark/5 shadow-soft flex flex-col bg-surface-2/50 backdrop-blur-sm">
          <header className="mb-10 flex items-center justify-between">
            <h3 className="font-heading text-xl text-main tracking-tight">Activity Stream</h3>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </header>
          
          <div className="space-y-6 flex-1">
            {[
              { title: 'Nueva Reserva: Medellín', desc: 'Carlos R. • Tour Pablo Escobar', time: '5m', dot: 'bg-brand-blue' },
              { title: 'Pago Verificado', desc: 'Stripe ID: ch_3P... (450€)', time: '22m', dot: 'bg-green-500' },
              { title: 'Alerta de Concierge', desc: 'Elena solicita cambio de fecha', time: '1h', dot: 'bg-brand-yellow' },
              { title: 'Nuevo Lead VIP', desc: 'Interés en expedición privada', time: '3h', dot: 'bg-brand-terra' }
            ].map((item, i) => (
              <div key={i} className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-surface transition-all duration-300 border border-transparent hover:border-brand-dark/5 cursor-pointer">
                <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${item.dot} shadow-sm group-hover:scale-150 transition-transform`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-main group-hover:text-brand-blue transition-colors truncate">{item.title}</p>
                  <p className="text-xs text-muted mt-1 truncate">{item.desc}</p>
                </div>
                <span className="text-[9px] font-mono text-muted opacity-60 bg-surface-2 px-2 py-1 rounded-md group-hover:bg-brand-dark group-hover:text-white transition-colors">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
          
          <Button variant="ghost" className="w-full mt-10 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-brand-blue transition-colors">
            Ver Auditoría Completa <ArrowUpRight className="ml-2 w-3 h-3" />
          </Button>
        </AdminCard>

      </div>
    </div>
  );
}