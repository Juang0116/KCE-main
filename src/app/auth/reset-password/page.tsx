'use client';

import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';

import ResetPasswordForm from '@/features/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const nextParam = sp?.get('next');

  return (
    <main className="min-h-[90vh] flex items-center justify-center bg-[#FDFCFB] px-6 py-20">
      <div className="w-full max-w-xl">
        
        {/* ENCABEZADO DE SEGURIDAD */}
        <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-[#004A7C]/5 flex items-center justify-center mb-6">
            <KeyRound className="h-8 w-8 text-[#004A7C]" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-[#004A7C] tracking-tight">
            Nueva contraseña
          </h1>
          <p className="text-slate-500 font-light text-lg max-w-xs mx-auto">
            Asegura tu cuenta con una combinación fuerte y única.
          </p>
        </div>

        {/* CONTENEDOR DEL FORMULARIO */}
        <div className="relative rounded-[3.5rem] border border-slate-100 bg-white p-8 md:p-16 shadow-[0_32px_64px_-16px_rgba(0,74,124,0.1)] overflow-hidden">
          {/* Acento decorativo sutil */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck className="size-32 text-[#004A7C]" />
          </div>

          <div className="relative z-10">
            <ResetPasswordForm nextParam={nextParam} />
          </div>
        </div>

        {/* PIE DE PÁGINA TÉCNICO */}
        <footer className="mt-12 flex flex-col items-center gap-6">
          <div className="h-[1px] w-12 bg-slate-200"></div>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5" /> 
            Protección de cuenta activa
          </div>
          
          <p className="text-[10px] text-slate-400 font-medium max-w-[240px] text-center leading-relaxed">
            Si no solicitaste este cambio, por favor contacta a nuestro equipo de seguridad inmediatamente.
          </p>
        </footer>
      </div>
    </main>
  );
}