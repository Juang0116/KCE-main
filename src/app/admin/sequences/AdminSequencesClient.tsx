'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { adminFetch } from '@/lib/adminFetch.client';

type Sequence = {
  id: string;
  key: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  channel: 'email' | 'whatsapp' | 'mixed';
  locale: string | null;
  description: string | null;
};

type Step = {
  step_index: number;
  delay_minutes: number;
  channel: 'email' | 'whatsapp';
  subject: string | null;
  body: string;
};

type SequencesListResponse = {
  items: Sequence[];
};

type SequenceDetailResponse = {
  sequence: Sequence;
  steps: Array<{
    step_index: number;
    delay_minutes?: number | null;
    channel?: Step['channel'] | null;
    subject?: string | null;
    body?: string | null;
  }>;
};

export function AdminSequencesClient() {
  const [items, setItems] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await adminFetch('/api/admin/sequences');

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as SequencesListResponse;
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setMsg(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function load(id: string) {
    setLoading(true);
    setMsg(null);

    try {
      const res = await adminFetch(`/api/admin/sequences/${id}`);

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as SequenceDetailResponse;

      setSelected(data.sequence);

      const st = Array.isArray(data.steps) ? data.steps : [];
      setSteps(
        st.map((x) => ({
          step_index: x.step_index,
          delay_minutes: x.delay_minutes ?? 0,
          channel: (x.channel ?? 'email') as Step['channel'],
          subject: x.subject ?? null,
          body: x.body ?? '',
        })),
      );
    } catch (e: any) {
      setMsg(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const canEdit = !!selected;

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10">
      <div className="p-3 flex flex-wrap items-center gap-2">
        <Button onClick={refresh} disabled={loading}>
          Recargar
        </Button>

        <Button
          variant="secondary"
          onClick={async () => {
            const key = prompt('Key (único)', 'checkout_followup');
            if (!key) return;

            const name = prompt('Nombre', 'Checkout follow-up');
            if (!name) return;

            const res = await adminFetch('/api/admin/sequences', {
              method: 'POST',
              body: JSON.stringify({
                key,
                name,
                status: 'draft',
                channel: 'mixed',
                locale: 'es',
              }),
            });

            if (!res.ok) {
              const t = await res.text().catch(() => '');
              setMsg(t || `HTTP ${res.status}`);
              return;
            }

            await refresh();
          }}
        >
          Nueva secuencia
        </Button>

        {msg ? <span className="text-sm text-red-600 dark:text-red-400">{msg}</span> : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="p-3 border-t border-black/10 dark:border-white/10 md:border-t-0 md:border-r">
          <h3 className="text-sm font-semibold">Secuencias</h3>

          <div className="mt-2 space-y-2">
            {items.map((s) => (
              <button
                key={s.id}
                className={[
                  'w-full text-left rounded-xl border px-3 py-2 text-sm',
                  'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10',
                  selected?.id === s.id ? 'bg-black/5 dark:bg-white/10' : '',
                ].join(' ')}
                onClick={() => load(s.id)}
              >
                <div className="font-medium">{s.name}</div>
                <div className="text-xs opacity-70">
                  {s.key} · {s.status} · {s.channel}
                </div>
              </button>
            ))}

            {items.length === 0 ? <div className="text-sm opacity-70">No hay secuencias.</div> : null}
          </div>
        </div>

        <div className="p-3 border-t border-black/10 dark:border-white/10 md:border-t-0 md:border-r">
          <h3 className="text-sm font-semibold">Detalles</h3>

          {!selected ? (
            <div className="mt-2 text-sm opacity-70">Selecciona una secuencia.</div>
          ) : (
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <span className="opacity-70">ID:</span> {selected.id}
              </div>
              <div>
                <span className="opacity-70">Key:</span> {selected.key}
              </div>
              <div>
                <span className="opacity-70">Estado:</span> {selected.status}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    const status = prompt('Estado (draft|active|paused|archived)', selected.status);
                    if (!status) return;

                    const res = await adminFetch('/api/admin/sequences', {
                      method: 'POST',
                      body: JSON.stringify({
                        id: selected.id,
                        key: selected.key,
                        name: selected.name,
                        status,
                      }),
                    });

                    if (!res.ok) {
                      const t = await res.text().catch(() => '');
                      setMsg(t || `HTTP ${res.status}`);
                      return;
                    }

                    await refresh();
                    await load(selected.id);
                  }}
                >
                  Cambiar estado
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    if (!confirm('Eliminar secuencia?')) return;

                    const res = await adminFetch(`/api/admin/sequences/${selected.id}`, {
                      method: 'DELETE',
                    });

                    if (!res.ok) {
                      const t = await res.text().catch(() => '');
                      setMsg(t || `HTTP ${res.status}`);
                      return;
                    }

                    setSelected(null);
                    setSteps([]);
                    await refresh();
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-black/10 dark:border-white/10 md:border-t-0">
          <h3 className="text-sm font-semibold">Steps</h3>

          {!canEdit ? (
            <div className="mt-2 text-sm opacity-70">Selecciona una secuencia.</div>
          ) : (
            <div className="mt-2 space-y-2">
              {steps.map((st, i) => (
                <div key={i} className="rounded-xl border border-black/10 dark:border-white/10 p-2">
                  <div className="flex items-center gap-2 text-xs opacity-80">
                    <span>#{st.step_index}</span>
                    <span>delay {st.delay_minutes}m</span>
                    <span>{st.channel}</span>
                  </div>

                  <input
                    className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 text-sm"
                    placeholder="Asunto (solo email)"
                    value={st.subject || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSteps((prev) => prev.map((x, idx) => (idx === i ? { ...x, subject: v || null } : x)));
                    }}
                  />

                  <textarea
                    className="mt-2 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 text-sm min-h-[90px]"
                    value={st.body}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSteps((prev) => prev.map((x, idx) => (idx === i ? { ...x, body: v } : x)));
                    }}
                  />
                </div>
              ))}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setSteps((p) => [
                      ...p,
                      {
                        step_index: p.length,
                        delay_minutes: p.length ? 60 : 0,
                        channel: 'email',
                        subject: '',
                        body: '',
                      },
                    ])
                  }
                >
                  + step
                </Button>

                <Button
                  size="sm"
                  onClick={async () => {
                    if (!selected) return;

                    const res = await adminFetch(`/api/admin/sequences/${selected.id}`, {
                      method: 'PUT',
                      body: JSON.stringify({ steps }),
                    });

                    if (!res.ok) {
                      const t = await res.text().catch(() => '');
                      setMsg(t || `HTTP ${res.status}`);
                      return;
                    }

                    setMsg('Guardado ✅');
                    setTimeout(() => setMsg(null), 1500);
                  }}
                >
                  Guardar steps
                </Button>
              </div>

              <div className="text-xs opacity-70">
                Para ejecutar steps: llama el cron{' '}
                <code className="px-1">/api/admin/sequences/cron</code> (requiere HMAC). Los WhatsApp quedan como{' '}
                <b>draft</b> para envío manual en <b>/admin/outbound</b>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
