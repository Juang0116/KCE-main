'use client';

/**
 * MFASetup — KCE
 * Flujo completo de configuración 2FA TOTP con Supabase Auth.
 * Pasos:
 *   1. Generar QR (enroll)
 *   2. Escanear con Google Authenticator / Authy
 *   3. Verificar código TOTP
 *   4. Confirmed — 2FA activo
 *
 * Respeta exactOptionalPropertyTypes: true (sin `undefined` explícito).
 */

import * as React from 'react';
import { QrCode, ShieldCheck, Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/Button';

type Step = 'idle' | 'loading' | 'qr' | 'verify' | 'confirmed' | 'error';

type EnrollData = {
  factorId: string;
  qrUri: string;    // data:image/svg+xml;... devuelto por Supabase
  secret: string;   // clave manual por si no pueden escanear
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000000"
      disabled={disabled}
      className="w-full text-center tracking-[0.5em] font-mono text-2xl rounded-xl border border-[color:var(--color-border)] px-4 py-3 outline-none focus:ring-2 focus:ring-brand-blue/30 bg-[color:var(--color-surface-2)] text-[color:var(--color-text)] disabled:opacity-50 transition-shadow"
      aria-label="Código de 6 dígitos de tu app de autenticación"
    />
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function MFASetup({ onSuccess }: { onSuccess?: () => void }) {
  const [step, setStep] = React.useState<Step>('idle');
  const [enrollData, setEnrollData] = React.useState<EnrollData | null>(null);
  const [code, setCode] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const supabase = React.useMemo(() => supabaseBrowser(), []);

  // Paso 1: iniciar enrollment
  async function startEnroll() {
    setStep('loading');
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error || !data) throw error ?? new Error('No se pudo iniciar 2FA.');

      const totp = data.totp;
      setEnrollData({
        factorId: data.id,
        qrUri: totp.qr_code,   // SVG data URI
        secret: totp.secret,
      });
      setStep('qr');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar 2FA.');
      setStep('error');
    }
  }

  // Paso 2: verificar código
  async function verifyCode() {
    if (!enrollData || code.length !== 6) return;
    setStep('loading');
    setErrorMsg('');
    try {
      // Primero crear el challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollData.factorId,
      });
      if (challengeError || !challengeData) throw challengeError ?? new Error('Challenge fallido.');

      // Luego verificar
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      setStep('confirmed');
      onSuccess?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Código incorrecto. Intenta de nuevo.');
      setStep('qr'); // vuelve a QR para que pueda reintentar
      setCode('');
    }
  }

  // Copiar clave manual
  async function copySecret() {
    if (!enrollData?.secret) return;
    await navigator.clipboard.writeText(enrollData.secret).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render por paso ─────────────────────────────────────────────────────────

  if (step === 'confirmed') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="size-14 text-green-500" aria-hidden />
        <h3 className="font-heading text-xl text-[color:var(--color-text)]">
          ¡2FA activado correctamente!
        </h3>
        <p className="text-sm text-[color:var(--color-text-muted)] max-w-xs">
          Tu cuenta ahora está protegida con autenticación de dos factores.
          Necesitarás tu app de autenticación en cada inicio de sesión.
        </p>
      </div>
    );
  }

  if (step === 'idle' || step === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-brand-blue/5 border border-brand-blue/10 p-4">
          <ShieldCheck className="size-5 text-brand-blue shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[color:var(--color-text)]">
              Autenticación de dos factores (2FA)
            </p>
            <p className="text-xs text-[color:var(--color-text-muted)] mt-1">
              Protege tu cuenta con una capa adicional. Necesitarás Google Authenticator,
              Authy u otra app TOTP compatible.
            </p>
          </div>
        </div>

        {step === 'error' && errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            {errorMsg}
          </div>
        )}

        <Button
          onClick={startEnroll}
          className="w-full bg-brand-blue text-white hover:bg-brand-blue/90"
        >
          <QrCode className="size-4 mr-2" aria-hidden />
          Configurar 2FA
        </Button>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="size-8 animate-spin text-brand-blue" aria-hidden />
        <p className="text-sm text-[color:var(--color-text-muted)]">Procesando…</p>
      </div>
    );
  }

  // step === 'qr' | 'verify'
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-[color:var(--color-text)] mb-1">
          {step === 'qr' ? 'Escanea el código QR' : 'Ingresa el código'}
        </h3>
        <p className="text-xs text-[color:var(--color-text-muted)]">
          {step === 'qr'
            ? 'Abre tu app de autenticación (Google Authenticator, Authy) y escanea el código.'
            : 'Ingresa el código de 6 dígitos que muestra tu app.'}
        </p>
      </div>

      {step === 'qr' && enrollData && (
        <>
          {/* QR code SVG */}
          <div className="flex justify-center">
            <div className="rounded-2xl border-2 border-brand-blue/20 p-3 bg-white shadow-sm">
              {/* Supabase devuelve SVG como string — lo embebemos como data URI en <img> */}
              <img
                src={enrollData.qrUri}
                alt="Código QR para 2FA"
                className="size-44"
                draggable={false}
              />
            </div>
          </div>

          {/* Clave manual */}
          <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
            <p className="text-xs text-[color:var(--color-text-muted)] mb-1">
              ¿No puedes escanear? Ingresa esta clave manualmente:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs break-all text-[color:var(--color-text)]">
                {enrollData.secret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                aria-label="Copiar clave"
                className="p-1.5 rounded-lg hover:bg-[color:var(--color-surface)] transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="size-4 text-green-500" aria-hidden />
                ) : (
                  <Copy className="size-4 text-[color:var(--color-text-muted)]" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={() => setStep('verify')}
            className="w-full bg-brand-blue text-white hover:bg-brand-blue/90"
          >
            Ya escaneé el código →
          </Button>
        </>
      )}

      {step === 'verify' && (
        <>
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {errorMsg}
            </div>
          )}

          <OtpInput value={code} onChange={setCode} disabled={false} />

          <Button
            onClick={verifyCode}
            disabled={code.length !== 6}
            className="w-full bg-brand-blue text-white hover:bg-brand-blue/90 disabled:opacity-50"
          >
            Verificar y activar 2FA
          </Button>

          <button
            type="button"
            onClick={() => { setStep('qr'); setCode(''); setErrorMsg(''); }}
            className="w-full text-xs text-center text-[color:var(--color-text-muted)] hover:text-brand-blue transition-colors"
          >
            ← Volver al QR
          </button>
        </>
      )}
    </div>
  );
}

export default MFASetup;
