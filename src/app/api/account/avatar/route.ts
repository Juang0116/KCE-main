import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { supabaseServer } from '@/lib/supabase/server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 2_500_000; // 2.5MB límite razonable para avatares

function json(status: number, body: any, rid: string) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Request-ID': rid,
    },
  });
}

function pickExt(fileName: string): string {
  const ext = (fileName.split('.').pop() || 'png').toLowerCase();
  return /^(png|jpg|jpeg|webp)$/i.test(ext) ? ext : 'png';
}

export async function POST(req: NextRequest) {
  return withRequestId(req, async () => {
    const rid = getRequestId(req.headers);

    // 1. Obtener sesión del usuario
    let sb;
    try {
      sb = await supabaseServer();
    } catch (e: any) {
      return json(500, { ok: false, error: 'Servicio de autenticación no disponible', requestId: rid }, rid);
    }

    const { data: { user }, error: authErr } = await sb.auth.getUser();
    
    if (authErr || !user) {
      return json(401, { ok: false, error: 'No autorizado', requestId: rid }, rid);
    }

    // 2. Validar FormData
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return json(400, { ok: false, error: 'Formato de formulario inválido', requestId: rid }, rid);
    }

    const file = form.get('file');
    if (!(file instanceof File)) {
      return json(400, { ok: false, error: 'Archivo no encontrado', requestId: rid }, rid);
    }

    // 3. Validaciones de archivo (Tamaño y Tipo)
    if (file.size > MAX_BYTES) {
      return json(413, { 
        ok: false, 
        error: `Imagen demasiado grande (máximo ${(MAX_BYTES / 1_000_000).toFixed(1)}MB)`, 
        requestId: rid 
      }, rid);
    }

    const ext = pickExt(file.name);
    const contentType = file.type.startsWith('image/') ? file.type : `image/${ext}`;

    // 4. Proceso de subida mediante Admin SDK
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const admin = getSupabaseAdmin();
      const bucket = 'review_avatars';
      // Carpeta organizada por userId y timestamp para evitar colisiones
      const path = `profiles/${user.id}/${Date.now()}.${ext}`;

      const { data: upData, error: upError } = await admin.storage
        .from(bucket)
        .upload(path, buf, {
          upsert: true,
          contentType,
          cacheControl: '3600',
        });

      if (upError) {
        throw new Error(upError.message);
      }

      // 5. Generar URL Pública
      const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);
      const url = urlData?.publicUrl || '';

      // 6. Log del evento para auditoría
      void logEvent('account.avatar_updated', {
        request_id: rid,
        file_size: file.size,
        file_ext: ext,
        path
      }, { userId: user.id, source: 'api' });

      return json(200, { ok: true, url, requestId: rid }, rid);

    } catch (e: any) {
      console.error(`[AvatarUpload Error] ${rid}:`, e.message);
      return json(500, { ok: false, error: 'Error al procesar la subida', requestId: rid }, rid);
    }
  });
}