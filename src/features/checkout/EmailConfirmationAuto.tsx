'use client';

import * as React from 'react';
import { CheckCircle, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EmailConfirmationAuto({ sessionId, paid }: { sessionId: string; paid: boolean }) {
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const send = React.useCallback(async () => {
    if (!paid || status === 'sent') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/email/booking-confirmation/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) setStatus('sent');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  }, [paid, sessionId, status]);

  React.useEffect(() => { if (paid) void send(); }, [paid, send]);

  if (!paid) return null;

  return (
    <div className="mt-8 rounded-2xl border border-brand-dark/5 bg-surface-2 p-6 transition-all">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-brand-blue/5 text-brand-blue'}`}>
          {status === 'sending' ? <RefreshCw className="size-5 animate-spin" /> : <Mail className="size-5" />}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Confirmación KCE</p>
          <p className="text-sm font-light text-main">
            {status === 'sending' ? 'Generando tu factura legal y voucher...' : 
             status === 'sent' ? 'Voucher enviado exitosamente a tu bandeja.' : 
             'Preparando envío automático de documentos.'}
          </p>
        </div>
      </div>
      {status === 'error' && (
        <Button onClick={send} variant="ghost" className="mt-4 text-xs font-bold uppercase text-brand-blue p-0">Reintentar envío</Button>
      )}
    </div>
  );
}