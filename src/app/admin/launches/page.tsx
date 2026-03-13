import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type LaunchRow = {
  id: string;
  name: string | null;
  market: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string | null;
};

export default async function AdminLaunchesPage() {
  const sb = getSupabaseAdmin();
  // Esta tabla es opcional y puede no existir en los tipos generados de Supabase.
  // Para no bloquear el build por desalineación de tipos, usamos cast a `any`.
  const sbAny = sb as any;

  const { data, error } = await sbAny
    .from('growth_launches')
    .select('id,name,market,status,start_date,end_date,notes,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const launches = (data ?? []) as LaunchRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Launches</h1>
        <p className="text-sm text-muted-foreground">
          Runbook de go-to-market (país/ciudad/segmento). Crea y gestiona checklists en Supabase usando el patch P82.
        </p>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Market</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Dates</th>
              <th className="text-left p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {launches.map((x) => (
              <tr key={x.id} className="border-t">
                <td className="p-3 font-medium">{x.name ?? '—'}</td>
                <td className="p-3">{x.market ?? '—'}</td>
                <td className="p-3">{x.status ?? '—'}</td>
                <td className="p-3">
                  {(x.start_date ?? '—') + ' → ' + (x.end_date ?? '—')}
                </td>
                <td className="p-3 max-w-[520px] truncate" title={x.notes ?? ''}>
                  {x.notes ?? '—'}
                </td>
              </tr>
            ))}

            {launches.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={5}>
                  Aún no hay lanzamientos.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border p-4 text-sm space-y-2">
        <div className="font-medium">Siguiente paso recomendado</div>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Crea un launch “Alemania - Colombia cultural premium Q2”</li>
          <li>Inserta checklist items (growth_launch_items) para Ads/SEO/Partners/Ops</li>
          <li>Usa UTM + ref partners para medir conversiones (P81)</li>
        </ol>
      </div>
    </div>
  );
}
