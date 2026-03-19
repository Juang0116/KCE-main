import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Escapa valores para CSV siguiendo el estándar RFC 4180.
 */
function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  // Si contiene comas, comillas o saltos de línea, encerramos en comillas dobles
  if (/[\n\r",]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const supabase = await supabaseServer();
  
  // 1. Verificación de sesión
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Consulta de eventos (limitada a los últimos 500 por performance)
  const { data, error } = await supabase
    .from('user_events')
    .select('created_at, type, ip, ua, meta')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: 'Error al consultar actividad' }, { status: 500 });
  }

  // 3. Construcción del CSV
  const headers = ['Fecha (UTC)', 'Evento', 'Detalle', 'Dirección IP', 'Navegador'];
  const rows = [headers.join(',')];

  data?.forEach((row) => {
    const meta = (row.meta as Record<string, any>) ?? {};
    // Intentamos extraer un resumen legible de los metadatos
    const summary = meta.summary || meta.action || meta.message || '-';
    
    const line = [
      csvEscape(row.created_at),
      csvEscape(row.type),
      csvEscape(summary),
      csvEscape(row.ip || 'N/A'),
      csvEscape(row.ua || 'N/A'),
    ];
    rows.push(line.join(','));
  });

  const csvContent = rows.join('\n');

  // 4. Respuesta con headers de descarga
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kce-activity-${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}