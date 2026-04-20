'use client';

/**
 * IdentityUpload — KCE
 * Permite al viajero subir su pasaporte o ID a Supabase Storage (bucket: identity_vault).
 * El archivo queda en: identity_vault/{user_id}/{timestamp}_{filename}
 * Se actualiza la columna identity_status en public.customers.
 *
 * Reglas exactOptionalPropertyTypes: true.
 */

import * as React from 'react';
import {
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/Button';

type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

type StatusMeta = {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
};

const STATUS_META: Record<VerificationStatus, StatusMeta> = {
  none: {
    icon: <ShieldCheck className="size-5 text-[color:var(--color-text-muted)]" aria-hidden />,
    label: 'Sin verificar',
    description: 'Sube tu documento para verificar tu identidad.',
    color: 'text-[color:var(--color-text-muted)]',
  },
  pending: {
    icon: <Clock className="size-5 text-amber-500" aria-hidden />,
    label: 'En revisión',
    description: 'Tu documento está siendo revisado. Te notificaremos por email.',
    color: 'text-amber-600',
  },
  verified: {
    icon: <CheckCircle2 className="size-5 text-green-500" aria-hidden />,
    label: 'Verificado',
    description: 'Tu identidad ha sido verificada correctamente.',
    color: 'text-green-600',
  },
  rejected: {
    icon: <XCircle className="size-5 text-red-500" aria-hidden />,
    label: 'Rechazado',
    description: 'El documento fue rechazado. Sube uno nuevo legible y vigente.',
    color: 'text-red-600',
  },
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE_MB = 8;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Formato no soportado. Usa JPG, PNG, WEBP o PDF.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `El archivo supera ${MAX_SIZE_MB} MB.`;
  }
  return null;
}

export function IdentityUpload() {
  const [status, setStatus] = React.useState<VerificationStatus>('none');
  const [uploading, setUploading] = React.useState(false);
  const [loadingStatus, setLoadingStatus] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const supabase = React.useMemo(() => supabaseBrowser(), []);

  // Cargar estado actual del usuario
  React.useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !active) return;

        const { data } = await (supabase as any)
          .from('customers')
          .select('identity_status')
          .eq('id', user.id)
          .maybeSingle();

        if (active && data?.identity_status) {
          setStatus(data.identity_status as VerificationStatus);
        }
      } catch {
        // best-effort
      } finally {
        if (active) setLoadingStatus(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [supabase]);

  async function handleUpload(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Debes estar autenticado para subir un documento.');

      // Path: identity_vault/{userId}/{timestamp}_{filename}
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${user.id}/${Date.now()}_id.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('identity_vault')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Actualizar estado en customers
      await (supabase as any)
        .from('customers')
        .upsert(
          {
            id: user.id,
            identity_status: 'pending',
            identity_doc_path: path,
          },
          { onConflict: 'id' },
        );

      setStatus('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el documento. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file) void handleUpload(file);
    // Reset input para permitir subir el mismo archivo si falla
    e.currentTarget.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleUpload(file);
  }

  const meta = STATUS_META[status];
  const canUpload = status === 'none' || status === 'rejected';

  if (loadingStatus) {
    return (
      <div className="flex items-center gap-2 py-4 text-[color:var(--color-text-muted)]">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        <span className="text-sm">Cargando estado de verificación…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <div className="flex items-start gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
        {meta.icon}
        <div>
          <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
          <p className="text-xs text-[color:var(--color-text-muted)] mt-0.5">{meta.description}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      {/* Zona de subida */}
      {canUpload && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Zona de carga de documento. Arrastra o haz clic para seleccionar."
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            className={[
              'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-colors cursor-pointer',
              dragOver
                ? 'border-brand-blue bg-brand-blue/5'
                : 'border-[color:var(--color-border)] hover:border-brand-blue/40 hover:bg-[color:var(--color-surface-2)]',
              uploading ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
          >
            {uploading ? (
              <Loader2 className="size-8 animate-spin text-brand-blue" aria-hidden />
            ) : (
              <Upload className="size-8 text-[color:var(--color-text-muted)]" aria-hidden />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-[color:var(--color-text)]">
                {uploading ? 'Subiendo documento…' : 'Arrastra tu documento aquí'}
              </p>
              <p className="text-xs text-[color:var(--color-text-muted)] mt-1">
                JPG, PNG, WEBP o PDF · Máx. {MAX_SIZE_MB} MB
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            className="sr-only"
            onChange={onFileChange}
            aria-hidden
            tabIndex={-1}
          />

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-brand-blue text-white hover:bg-brand-blue/90 disabled:opacity-50"
          >
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Subiendo…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <FileText className="size-4" aria-hidden />
                Seleccionar documento
              </span>
            )}
          </Button>

          <p className="text-xs text-center text-[color:var(--color-text-muted)]">
            Tus datos están cifrados y solo son accesibles por ti y nuestro equipo de verificación.
          </p>
        </>
      )}
    </div>
  );
}

export default IdentityUpload;
