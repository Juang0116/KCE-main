'use client';


import { useEffect, useMemo, useState } from 'react';

import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';

type Template = {
  id: string;
  key: string;
  locale: string;
  channel: 'whatsapp' | 'email' | 'any';
  variant: string;
  weight: number;
  subject: string | null;
  body: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

const channelOptions: Template['channel'][] = ['whatsapp', 'email', 'any'];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export function AdminTemplatesClient() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');
  const [perf, setPerf] = useState<Record<string, any>>({});

  const [qKey, setQKey] = useState('');
  const [qLocale, setQLocale] = useState('');
  const [qChannel, setQChannel] = useState('');

  const [draft, setDraft] = useState<Partial<Template>>({
    key: 'deal.followup.checkout',
    locale: 'es',
    channel: 'whatsapp',
    variant: 'A',
    weight: 1,
    enabled: true,
    subject: null,
    body: 'Hola {name} 🙌 Te comparto el link de pago para confirmar tu reserva de {tour}: {checkout_url}',
  });

  const filtered = useMemo(() => {
    const k = qKey.trim().toLowerCase();
    const l = qLocale.trim().toLowerCase();
    const c = qChannel.trim().toLowerCase();
    return items.filter((it) => {
      if (k && !it.key.toLowerCase().includes(k)) return false;
      if (l && it.locale.toLowerCase() !== l) return false;
      if (c && it.channel.toLowerCase() !== c) return false;
      return true;
    });
  }, [items, qKey, qLocale, qChannel]);

  async function load() {
    setMsg('');
    setLoading(true);
    try {
      const data = await api<{ items: Template[] }>('/api/admin/templates?limit=500');
      setItems(data.items || []);
      try {
        const perfRes = await api<{ items: any[] }>(`/api/admin/templates/perf-summary?days=30&limit=5000`);
        const map: Record<string, any> = {};
        for (const it of perfRes.items || []) {
          const k = `${it.key}|${it.channel}|${it.locale}`;
          map[k] = it;
        }
        setPerf(map);
      } catch {
        // metrics are best-effort
        setPerf({});
      }
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudieron cargar las plantillas.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveDraft() {
    setMsg('');
    setLoading(true);
    try {
      const body = {
        id: draft.id,
        key: String(draft.key || '').trim(),
        locale: String(draft.locale || 'es').trim().toLowerCase(),
        channel: (draft.channel || 'whatsapp') as Template['channel'],
        variant: String((draft as any).variant ?? 'A').toUpperCase(),
        weight: Number((draft as any).weight ?? 1),
        subject: draft.subject ?? null,
        body: String(draft.body || ''),
        enabled: Boolean(draft.enabled ?? true),
      };
      const res = await api<{ item: Template }>('/api/admin/templates', { method: 'POST', body: JSON.stringify(body) });
      // merge/replace
      setItems((prev) => {
        const idx = prev.findIndex((x) => x.id === res.item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = res.item;
          return next;
        }
        return [res.item, ...prev];
      });
      setDraft({ ...res.item });
      setMsg('✅ Guardado');
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo guardar.'));
    } finally {
      setLoading(false);
    }
  }


  async function optimizeAB() {
    setMsg('');
    setLoading(true);
    try {
      const res = await api<{ result: any }>('/api/admin/templates/optimize', {
        method: 'POST',
        body: JSON.stringify({ days: 30, minSamples: 40, lockDays: 7, applyWeights: true }),
      });
      const created = res?.result?.winnersCreated ?? res?.result?.result?.winnersCreated;
      const updated = res?.result?.weightsUpdated ?? res?.result?.result?.weightsUpdated;
      setMsg(`✅ Optimización A/B OK — winners: ${created ?? 0}, weights: ${updated ?? 0}`);
      // refresh perf snapshot
      await load();
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo optimizar.'));
    } finally {
      setLoading(false);
    }
  }

  function edit(it: Template) {
    setDraft({ ...it });
    setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar plantilla?')) return;
    setMsg('');
    setLoading(true);
    try {
      await api(`/api/admin/templates/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (draft.id === id) setDraft({ key: '', locale: 'es', channel: 'whatsapp', enabled: true, subject: null, body: '' });
      setMsg('🗑️ Eliminado');
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo eliminar.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Editor</div>
            <div className="text-xs text-[color:var(--color-text)]/70">
              Usa placeholders: {'{name}'}, {'{tour}'}, {'{date}'}, {'{people}'}, {'{checkout_url}'}.
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load} isLoading={loading}>Recargar</Button>
            <Button variant="secondary" onClick={optimizeAB} isLoading={loading}>Optimizar A/B</Button>
            <Button onClick={saveDraft} isLoading={loading}>Guardar</Button>
          </div>
        </div>

        {msg ? <div className="mt-3 text-sm text-[color:var(--color-text)]/80">{msg}</div> : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Key</span>
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={draft.key || ''}
              onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
              placeholder="deal.followup.checkout"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Locale</span>
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={draft.locale || ''}
              onChange={(e) => setDraft((d) => ({ ...d, locale: e.target.value }))}
              placeholder="es | en | de"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Canal</span>
            <select
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={(draft.channel || 'whatsapp') as any}
              onChange={(e) => setDraft((d) => ({ ...d, channel: e.target.value as any }))}
            >
              {channelOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>


          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Variante</span>
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={(draft.variant as any) || 'A'}
              onChange={(e) => setDraft((d) => ({ ...d, variant: e.target.value || 'A' }))}
              placeholder="A"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Peso</span>
            <input
              type="number"
              min={1}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={Number((draft.weight as any) ?? 1)}
              onChange={(e) => setDraft((d) => ({ ...d, weight: Math.max(1, Number(e.target.value || 1)) }))}
            />
          </label>

        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--color-text)]/70">Subject (Email)</span>
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={draft.subject ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value || null }))}
              placeholder="Reserva {tour} - Link de pago"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black">
            <input
              type="checkbox"
              checked={Boolean(draft.enabled ?? true)}
              onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))}
            />
            <span className="text-[color:var(--color-text)]/80">Enabled</span>
          </label>
        </div>

        <label className="mt-3 grid gap-1">
          <span className="text-xs text-[color:var(--color-text)]/70">Body</span>
          <textarea
            className="min-h-[140px] rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
            value={draft.body || ''}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
            placeholder="Texto del mensaje..."
          />
        </label>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Lista</div>
          <div className="grid w-full gap-2 md:w-auto md:grid-cols-3">
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={qKey}
              onChange={(e) => setQKey(e.target.value)}
              placeholder="filtrar por key"
            />
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={qLocale}
              onChange={(e) => setQLocale(e.target.value)}
              placeholder="locale"
            />
            <input
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-black"
              value={qChannel}
              onChange={(e) => setQChannel(e.target.value)}
              placeholder="channel"
            />
          </div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs text-[color:var(--color-text)]/60">
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="py-2 pr-2">Key</th>
                <th className="py-2 pr-2">Locale</th>
                <th className="py-2 pr-2">Channel</th>
                <th className="py-2 pr-2">Enabled</th>
                <th className="py-2 pr-2">Updated</th>
                <th className="py-2 pr-2">Winner (30d)</th>
                <th className="py-2 pr-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-2 font-mono text-xs">{it.key}</td>
                  <td className="py-2 pr-2">{it.locale}</td>
                  <td className="py-2 pr-2">{it.channel}</td>
                  <td className="py-2 pr-2">{it.enabled ? '✅' : '—'}</td>
                  <td className="py-2 pr-2 text-xs text-[color:var(--color-text)]/70">
                    {(() => {
                      const k = `${it.key}|${it.channel}|${it.locale}`;
                      const p = perf[k];
                      const w = p?.winner ?? null;
                      const top = p?.variants?.[0];
                      if (!w) return <span className="opacity-60">—</span>;
                      const paidPct = top?.paidRate != null ? `${(top.paidRate * 100).toFixed(1)}%` : '—';
                      const sent = top?.sent ?? 0;
                      return (
                        <span title={`winner ${w} · paid ${paidPct} · sent ${sent}`}>
                          {w} · {paidPct}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => edit(it)}>Editar</Button>
                      <Button variant="secondary" onClick={() => del(it.id)}>Eliminar</Button>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          const email = prompt('Email destino para prueba:');
                          if (!email) return;
                          setTestResult(null);
                          const res = await adminFetch('/api/admin/templates/test-send', {
                            method: 'POST',
                            body: JSON.stringify({ templateId: it.id, toEmail: email }),
                          });
                          const d = await res.json();
                          setTestResult(d.ok ? `✅ Enviado a ${email}` : `❌ ${d.error}`);
                          setTimeout(() => setTestResult(null), 5000);
                        }}
                      >
                        Enviar prueba
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
