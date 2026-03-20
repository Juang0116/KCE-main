'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, UserCircle, Mail, MessageSquare, AlertCircle } from 'lucide-react';

type Status = 'idle' | 'sending' | 'success' | 'error';

export type ContactFormProps = {
  initialEmail?: string;
  initialWhatsapp?: string;
  initialMessage?: string;
  source: string;
  topic: string;
  salesContext?: any;
  continueLinks?: Array<{ href: string; label: string; copy: string }>;
};

export default function ContactForm({
  initialEmail = '',
  initialWhatsapp = '', 
  initialMessage = '',
  source,
  topic,
  salesContext,
  continueLinks = [],
}: ContactFormProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState(initialEmail);
  const [message, setMessage] = React.useState(initialMessage);
  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pasamos el initialWhatsapp directamente si lo necesitamos
        body: JSON.stringify({ name, email, whatsapp: initialWhatsapp, message, source, topic, salesContext }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'No pudimos enviar tu mensaje. Intenta de nuevo.');
      }
      setStatus('success');
    } catch (err: any) {
      console.error('Contact error:', err);
      setStatus('error');
      setErrorMsg(err?.message || 'Ocurrió un error. Escríbenos por WhatsApp o directamente al correo.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-[2.5rem] border border-brand-blue/20 bg-brand-blue/5 p-10 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-16 w-16 text-brand-blue mb-6" />
        <h3 className="font-heading text-3xl text-brand-blue mb-4">¡Mensaje recibido!</h3>
        <p className="text-sm font-light text-[color:var(--color-text)]/80 leading-relaxed mb-8 max-w-md mx-auto">
          Un experto local de nuestro equipo revisará tu caso y te contactará en breve. Si es urgente, recuerda que también tienes nuestro canal de WhatsApp activo.
        </p>

        {continueLinks.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {continueLinks.slice(0, 2).map((link, idx) => (
              <Link key={idx} href={link.href} className="group rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-left transition-all hover:border-brand-blue/30 hover:shadow-soft">
                <div className="font-bold text-[10px] uppercase tracking-widest text-[color:var(--color-text)] group-hover:text-brand-blue transition-colors mb-2">{link.label}</div>
                <div className="text-xs font-light text-[color:var(--color-text)]/60 leading-relaxed">{link.copy}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {status === 'error' && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-500/20 shadow-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" /> <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2 flex flex-col">
          <label htmlFor="contact_name" className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 ml-1">
            Tu Nombre
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[color:var(--color-text)]/30">
              <UserCircle className="h-5 w-5" />
            </div>
            <input 
              id="contact_name"
              required 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ej: Laura García" 
              className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-blue focus:bg-[color:var(--color-surface)] transition-all placeholder:font-light" 
              disabled={status === 'sending'} 
            />
          </div>
        </div>

        <div className="space-y-2 flex flex-col">
          <label htmlFor="contact_email" className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 ml-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[color:var(--color-text)]/30">
              <Mail className="h-5 w-5" />
            </div>
            <input 
              id="contact_email"
              required 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="tu@email.com" 
              className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-blue focus:bg-[color:var(--color-surface)] transition-all placeholder:font-light" 
              disabled={status === 'sending'} 
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 flex flex-col">
        <label htmlFor="contact_message" className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 ml-1">
          ¿Cómo podemos ayudarte?
        </label>
        <div className="relative">
          <div className="absolute top-4 left-4 pointer-events-none text-[color:var(--color-text)]/30">
            <MessageSquare className="h-5 w-5" />
          </div>
          <textarea 
            id="contact_message"
            required 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Escribe aquí los detalles de tu consulta, fechas o tours de interés..." 
            rows={5} 
            className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-11 pr-4 py-4 text-sm outline-none focus:border-brand-blue focus:bg-[color:var(--color-surface)] transition-all placeholder:font-light resize-none" 
            disabled={status === 'sending'} 
          />
        </div>
      </div>

      <button type="submit" disabled={status === 'sending'} className="w-full flex mt-6 items-center justify-center gap-2 rounded-full bg-brand-blue px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md disabled:opacity-50">
        {status === 'sending' ? 'Enviando...' : <>{'Enviar a Conserjería'} <ArrowRight className="h-4 w-4" /></>}
      </button>
      
      <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 text-center mt-4">
        Tus datos están protegidos bajo nuestra política de privacidad.
      </p>
    </form>
  );
}