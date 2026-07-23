'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  UserCircle,
  Mail,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

type Status = 'idle' | 'sending' | 'success' | 'error';

export type ContactFormProps = {
  initialEmail?: string;
  initialWhatsapp?: string;
  initialMessage?: string;
  source: string;
  topic: string;
  salesContext?: any;
  continueLinks?: Array<{ href: string; label: string; copy: string }>;
  locale?: string;
};

const FORM_STRINGS: Record<string, Record<string, string>> = {
  es: {
    name: 'Tu Nombre',
    email: 'Email',
    message: '¿Cómo podemos ayudarte?',
    send: 'Enviar a Conserjería',
    sending: 'Enviando...',
    success: '¡Mensaje recibido!',
    error: 'Error al enviar. Intenta de nuevo.',
  },
  en: {
    name: 'Your Name',
    email: 'Email',
    message: 'How can we help you?',
    send: 'Send to Concierge',
    sending: 'Sending...',
    success: 'Message received!',
    error: 'Error sending. Please try again.',
  },
  fr: {
    name: 'Votre Nom',
    email: 'Email',
    message: 'Comment pouvons-nous vous aider ?',
    send: 'Envoyer au Concierge',
    sending: 'Envoi...',
    success: 'Message reçu !',
    error: "Erreur d'envoi. Réessayez.",
  },
  de: {
    name: 'Ihr Name',
    email: 'E-Mail',
    message: 'Wie können wir helfen?',
    send: 'An Concierge senden',
    sending: 'Senden...',
    success: 'Nachricht erhalten!',
    error: 'Fehler beim Senden. Bitte erneut versuchen.',
  },
};

export default function ContactForm({
  initialEmail = '',
  initialWhatsapp = '',
  initialMessage = '',
  source,
  topic,
  salesContext,
  locale = 'es',
  continueLinks = [],
}: ContactFormProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState(initialEmail);
  const [message, setMessage] = React.useState(initialMessage);

  const ui = FORM_STRINGS[locale] ?? FORM_STRINGS['es']!;

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
        body: JSON.stringify({
          name,
          email,
          whatsapp: initialWhatsapp,
          message,
          source,
          topic,
          salesContext,
          consent: true,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        // 🚨 CÓDIGO DE DIAGNÓSTICO: Extraemos qué campo exacto rebotó el validador Zod
        let detallesError = '';
        if (body.details && body.details.fieldErrors) {
          detallesError = JSON.stringify(body.details.fieldErrors);
        }

        // Lanzamos el error con los detalles para que aparezca en la caja roja de la web
        throw new Error(`${body.error || 'Error'}. Detalles: ${detallesError || 'Desconocido'}`);
      }
      setStatus('success');
    } catch (err: any) {
      console.error('Contact error:', err);
      setStatus('error');
      setErrorMsg(
        err?.message || 'Ocurrió un error. Escríbenos por WhatsApp o directamente al correo.',
      );
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-[2.5rem] border border-brand-blue/20 bg-brand-blue/5 p-10 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-brand-blue" />
        <h3 className="mb-4 font-heading text-3xl text-brand-blue">{ui.success}</h3>
        <p className="mx-auto mb-8 max-w-md text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">
          Un experto local de nuestro equipo revisará tu caso y te contactará en breve. Si es
          urgente, recuerda que también tienes nuestro canal de WhatsApp activo.
        </p>

        {continueLinks.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {continueLinks.slice(0, 2).map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="group rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-left transition-all hover:border-brand-blue/30 hover:shadow-soft"
              >
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)] transition-colors group-hover:text-brand-blue">
                  {link.label}
                </div>
                <div className="text-xs font-light leading-relaxed text-[color:var(--color-text-muted)]">
                  {link.copy}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5"
    >
      {status === 'error' && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col space-y-2">
          <label
            htmlFor="contact_name"
            className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]"
          >
            Tu Nombre
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[color:var(--color-text-muted)]">
              <UserCircle className="h-5 w-5" />
            </div>
            <input
              id="contact_name"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Laura García"
              className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] py-3.5 pl-11 pr-4 text-sm text-[color:var(--color-text)] outline-none transition-all placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-brand-blue/30"
              disabled={status === 'sending'}
            />
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <label
            htmlFor="contact_email"
            className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]"
          >
            Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[color:var(--color-text-muted)]">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="contact_email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] py-3.5 pl-11 pr-4 text-sm text-[color:var(--color-text)] outline-none transition-all placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-brand-blue/30"
              disabled={status === 'sending'}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <label
          htmlFor="contact_message"
          className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]"
        >
          ¿Cómo podemos ayudarte?
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-4 text-[color:var(--color-text-muted)]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <textarea
            id="contact_message"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe aquí los detalles de tu consulta, fechas o tours de interés..."
            rows={5}
            className="w-full resize-none rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] py-4 pl-11 pr-4 text-sm text-[color:var(--color-text)] outline-none transition-all placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-brand-blue/30"
            disabled={status === 'sending'}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-blue px-6 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-md transition hover:bg-brand-blue/90 disabled:opacity-50"
      >
        {status === 'sending' ? (
          ui.sending
        ) : (
          <>
            {ui.send} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
        Tus datos están protegidos bajo nuestra política de privacidad.
      </p>
    </form>
  );
}
