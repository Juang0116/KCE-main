'use client';

/**
 * IdentityUpload — KCE
 * Permite al viajero subir su pasaporte o ID a Supabase Storage (bucket: identity_vault).
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
    icon: (
      <ShieldCheck
        className="size-5 text-[color:var(--color-text-muted)]"
        aria-hidden
      />
    ),
    label: 'Sin verificar',
    description: 'Sube tu documento para verificar tu identidad.',
    color: 'text-[color:var(--color-text-muted)]',
  },
  pending: {
    icon: (
      <Clock
        className="size-5 text-amber-500"
        aria-hidden
      />
    ),
    label: 'En revisión',
    description: 'Tu documento está siendo revisado. Te notificaremos por email.',
    color: 'text-amber-600',
  },
  verified: {
    icon: (
      <CheckCircle2
        className="size-5 text-green-500"
        aria-hidden
      />
    ),
    label: 'Verificado',
    description: 'Tu identidad ha sido verificada correctamente.',
    color: 'text-green-600',
  },
  rejected: {
    icon: (
      <XCircle
        className="size-5 text-red-500"
        aria-hidden
      />
    ),
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

export function IdentityUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [status, setStatus] = React.useState<VerificationStatus>('none');
  const [uploading, setUploading] = React.useState(false);
  const [loadingStatus, setLoadingStatus] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const supabase = supabaseBrowser();

  React.useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase!.auth.getUser();
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
        // ignore
      } finally {
        if (active) setLoadingStatus(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleUpload(file: File) {
    if (!supabase) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes estar autenticado.');

      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${user.id}/${Date.now()}_id.${ext}`;

      // 1. Subir al Storage (Bucket)
      const { error: uploadError } = await supabase.storage
        .from('identity_vault')
        .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Actualizar base de datos (Aquí es donde estaba fallando en silencio)
      const { error: dbError } = await (supabase as any)
        .from('customers')
        .upsert({ id: user.id, identity_status: 'pending', identity_doc_path: path });

      // Si la base de datos (RLS) lo bloquea, lanzamos el error visiblemente
      if (dbError)
        throw new Error(dbError.message || 'Error de base de datos (Posible bloqueo RLS).');

      setStatus('pending');
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al subir documento.');
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file) void handleUpload(file);
    e.currentTarget.value = '';
  }

  const meta = STATUS_META[status];
  const canUpload = status === 'none' || status === 'rejected';

  if (!supabase) return null;

  if (loadingStatus) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="size-4 animate-spin text-muted" />
        <span className="text-xs text-muted">Cargando estado...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
        {meta.icon}
        <div>
          <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
          <p className="text-[10px] leading-tight text-[color:var(--color-text-muted)]">
            {meta.description}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </div>
      )}

      {canUpload && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[color:var(--color-border)] p-4 transition-colors hover:bg-brand-blue/5"
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-brand-blue" />
            ) : (
              <Upload className="size-6 text-muted" />
            )}
            <p className="text-xs font-medium text-[color:var(--color-text)]">
              {uploading ? 'Subiendo...' : 'Haz clic para subir tu ID'}
            </p>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            className="sr-only"
            onChange={onFileChange}
          />
        </>
      )}
    </div>
  );
}

export default IdentityUpload;
