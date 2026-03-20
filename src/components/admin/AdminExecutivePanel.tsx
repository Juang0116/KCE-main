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
  ArrowUpRight
} from 'lucide-react';
import { 
  AdminCard, 
  AdminCardHeader, 
  AdminCardTitle, 
  AdminCardSubtitle 
} from '@/components/admin/AdminCard';

// Exportamos por defecto y también con nombre para evitar el error "Element type is invalid..."
export default function AdminExecutivePanel() {
  return (
    <div className="space-y-8 animate-fade-in w-full max-w-[var(--container-max)] mx-auto">
      
      {/* --- ENCABEZADO PREMIUM --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[color:var(--color-border)] pb-8">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
            <Activity className="h-3.5 w-3.5" /> Command Center
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-[color:var(--color-text)] tracking-tight">
            Executive <span className="text-brand-terra">Overview</span>
          </h1>
          <p className="text-[color:var(--color-text-muted)] mt-2 font-body text-sm md:text-base max-w-2xl">
            Visión global de rendimiento, conversiones y operaciones tácticas de Kolombia Coffee Experience.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline text-xs bg-[color:var(--color-surface)] backdrop-blur-sm shadow-soft">
            <Download className="w-4 h-4 mr-2" /> Exportar Data
          </button>
          <button className="btn bg-brand-blue text-white text-xs shadow-pop hover:shadow-hard hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4 mr-2" /> Nueva Campaña
          </button>
        </div>
      </header>

      {/* --- KPIS (Métricas Clave con Sinergia) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminCard hoverEffect className="group">
          <AdminCardSubtitle className="flex items-center justify-between">
            Reservas Activas (Mes) <BarChart3 className="w-4 h-4 text-[color:var(--color-text-muted)] opacity-50 group-hover:text-brand-blue transition-colors" />
          </AdminCardSubtitle>
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="text-5xl font-heading font-bold text-[color:var(--color-text)] group-hover:text-brand-blue transition-colors">
              142
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-success)] mb-2 flex items-center bg-[color:var(--color-success)]/10 px-2.5 py-1 rounded-md border border-[color:var(--color-success)]/20">
              <TrendingUp className="w-3 h-3 mr-1" /> 12%
            </span>
          </div>
        </AdminCard>

        <AdminCard hoverEffect className="group">
          <AdminCardSubtitle className="flex items-center justify-between">
            Ingresos Proyectados <Target className="w-4 h-4 text-[color:var(--color-text-muted)] opacity-50 group-hover:text-brand-yellow transition-colors" />
          </AdminCardSubtitle>
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="text-5xl font-heading font-bold text-brand-blue">
              $24.5k
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-success)] mb-2 flex items-center bg-[color:var(--color-success)]/10 px-2.5 py-1 rounded-md border border-[color:var(--color-success)]/20">
              <TrendingUp className="w-3 h-3 mr-1" /> 5.4%
            </span>
          </div>
        </AdminCard>

        <AdminCard hoverEffect className="group">
          <AdminCardSubtitle className="flex items-center justify-between">
            Conversión General <Activity className="w-4 h-4 text-[color:var(--color-text-muted)] opacity-50 group-hover:text-brand-terra transition-colors" />
          </AdminCardSubtitle>
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="text-5xl font-heading font-bold text-brand-terra">
              4.8%
            </span>
            <span className="text-xs font-bold tracking-wider text-[color:var(--color-text-muted)] mb-2 flex items-center bg-[color:var(--color-surface-2)] px-2.5 py-1 rounded-md border border-[color:var(--color-border)]">
              Estable
            </span>
          </div>
        </AdminCard>
      </div>

      {/* --- PANEL INFERIOR --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Columna Ancha: Gráfico */}
        <div className="xl:col-span-2">
          <AdminCard className="h-full flex flex-col">
            <AdminCardHeader>
              <div>
                <AdminCardTitle>Rendimiento por Destino</AdminCardTitle>
                <AdminCardSubtitle>Evolución de reservas en los destinos principales en los últimos 30 días</AdminCardSubtitle>
              </div>
            </AdminCardHeader>
            {/* Contenedor del gráfico */}
            <div className="flex-1 w-full rounded-2xl bg-gradient-to-b from-[var(--color-surface-2)]/80 to-[var(--color-surface-2)]/30 border border-[color:var(--color-border)] min-h-[350px] flex items-center justify-center mt-2 group relative overflow-hidden">
              {/* Aquí va el componente de gráfico real (Recharts/Chartjs). Esto es un placeholder elegante */}
              <div className="text-center flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity">
                <BarChart3 className="w-10 h-10 text-brand-blue mb-3 animate-pulse" />
                <span className="text-sm font-medium tracking-widest uppercase text-[color:var(--color-text)]">Espacio para Gráfico Interactivo</span>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Columna Estrecha: Seamless Activity Feed */}
        <div className="xl:col-span-1">
          <AdminCard className="h-full flex flex-col">
            <AdminCardHeader>
              <AdminCardTitle>Flujo de Actividad</AdminCardTitle>
            </AdminCardHeader>
            
            <div className="flex-1 flex flex-col -mx-2 mt-2">
              {[
                { title: 'Nuevo Lead: Medellín', desc: 'Carlos R. vía Organic Search', time: 'Hace 5 min', dot: 'bg-brand-blue' },
                { title: 'Reserva Confirmada', desc: 'Tour Eje Cafetero (2 pax)', time: 'Hace 22 min', dot: 'bg-[color:var(--color-success)]' },
                { title: 'Alerta Operativa', desc: 'Actualización de Inventario', time: 'Hace 1 hora', dot: 'bg-brand-yellow' },
                { title: 'Soporte VIP', desc: 'Consulta abierta por Elena', time: 'Hace 2 horas', dot: 'bg-brand-terra' }
              ].map((item, i) => (
                <div key={i} className="group relative flex items-start gap-4 p-3 rounded-xl hover:bg-[color:var(--color-surface-2)]/80 transition-colors cursor-pointer border-b border-[color:var(--color-border)] last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 shadow-sm ${item.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[color:var(--color-text)] group-hover:text-brand-blue transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[color:var(--color-text-muted)] mt-0.5 truncate">
                      {item.desc}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-start gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-[color:var(--color-text-muted)] opacity-70 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.time}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[color:var(--color-text-muted)] opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" />
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-2.5 rounded-xl border border-[color:var(--color-border)] text-xs font-bold uppercase tracking-wider text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)] transition-colors flex items-center justify-center gap-2">
              Auditoría Completa <ArrowUpRight className="w-3 h-3" />
            </button>
          </AdminCard>
        </div>

      </div>
    </div>
  );
}

// Mantenemos la exportación con nombre por si acaso lo estás importando como { AdminExecutivePanel }
export { AdminExecutivePanel as AdminExecutivePanelNamed };