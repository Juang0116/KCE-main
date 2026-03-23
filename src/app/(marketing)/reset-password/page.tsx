// src/app/(marketing)/reset-password/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';
import ResetPasswordForm from '@/features/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Restablecer contraseña | KCE',
  description: 'Define una nueva contraseña segura para tu cuenta de viajero KCE.',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-base flex flex-col items-center justify-center px-6 py-24 animate-fade-in relative overflow-hidden">
      
      {/* Destellos ambientales sutiles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        
        {/* Encabezado Editorial */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 shadow-sm mb-6 transition-transform hover:scale-105 duration-500">
            <KeyRound className="h-8 w-8 text-brand-blue" />
          </div>
          
          <h1 className="font-heading text-4xl text-main tracking-tight mb-3 leading-tight">
            Nueva contraseña
          </h1>
          
          <p className="text-base font-light text-muted leading-relaxed">
            Define una llave segura para recuperar el acceso a tu espacio <span className="text-brand-blue italic">KCE</span>.
          </p>
        </div>

        {/* Tarjeta del Formulario (Premium Surface) */}
        <div className="rounded-[var(--radius-2xl)] border border-brand-dark/10 dark:border-white/10 bg-surface p-8 md:p-10 shadow-pop relative overflow-hidden group">
          {/* Línea de acento superior */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent" />
          
          <ResetPasswordForm />

          <div className="mt-8 pt-6 border-t border-brand-dark/5 dark:border-white/5 flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-600/50" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">Conexión Segura AES-256</span>
          </div>
        </div>

        {/* Footer de navegación */}
        <div className="mt-8 text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-brand-blue transition-colors group"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Volver al inicio de sesión
          </Link>
        </div>

      </div>

      {/* Marca de agua sutil en el footer de la página */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted opacity-30">
          Knowing Cultures Enterprise · 2026
        </p>
      </div>
    </main>
  );
}