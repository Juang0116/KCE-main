'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import {
  Mail,
  MessageCircle,
  RefreshCw,
  Save,
  Sparkles,
  TestTube,
  Trash2,
  Edit3,
  Type,
  CheckCircle2,
} from 'lucide-react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';

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
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

export function AdminTemplatesClient() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [testResult, setTestResult] = useState<string | null>(null);
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
        const perfRes = await api<{ items: any[] }>(
          `/api/admin/templates/perf-summary?days=30&limit=5000`,
        );
        const map: Record<string, any> = {};
        for (const it of perfRes.items || []) {
          map[`${it.key}|${it.channel}|${it.locale}`] = it;
        }
        setPerf(map);
      } catch {
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
        locale: String(draft.locale || 'es')
          .trim()
          .toLowerCase(),
        channel: (draft.channel || 'whatsapp') as Template['channel'],
        variant: String((draft as any).variant ?? 'A').toUpperCase(),
        weight: Number((draft as any).weight ?? 1),
        subject: draft.subject ?? null,
        body: String(draft.body || ''),
        enabled: Boolean(draft.enabled ?? true),
      };
      const res = await api<{ item: Template }>('/api/admin/templates', {
        method: 'POST',
        body: JSON.stringify(body),
      });
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
      setMsg('Plantilla Guardada ✅');
      setTimeout(() => setMsg(''), 3000);
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
      setMsg(`Optimización A/B OK — Winners: ${created ?? 0}, Weights: ${updated ?? 0} ✅`);
      await load();
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo optimizar.'));
    } finally {
      setLoading(false);
    }
  }

  function edit(it: Template) {
    setDraft({ ...it });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function del(id: string) {
    if (!confirm('¿Seguro que quieres eliminar esta plantilla?')) return;
    setMsg('');
    setLoading(true);
    try {
      await api(`/api/admin/templates/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (draft.id === id)
        setDraft({
          key: '',
          locale: 'es',
          channel: 'whatsapp',
          enabled: true,
          subject: null,
          body: '',
        });
      setMsg('Plantilla Eliminada 🗑️');
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo eliminar.'));
    } finally {
      setLoading(false);
    }
  }

  const templateSignals = useMemo(() => {
    const total = items.length;
    const whatsapps = items.filter((i) => i.channel === 'whatsapp').length;
    const emails = items.filter((i) => i.channel === 'email').length;
    return [
      { label: 'Plantillas', value: String(total), note: 'Activas en el sistema.' },
      { label: 'Emails', value: String(emails), note: 'Para automatizaciones formales.' },
      { label: 'WhatsApps', value: String(whatsapps), note: 'Para cierres rápidos.' },
    ];
  }, [items]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-3xl text-brand-blue md:text-4xl">
            Playbooks & Plantillas
          </h1>
          <p className="text-[color:var(--color-text)]/60 mt-2 text-sm font-light">
            Control de copys, mensajes automáticos y tests A/B.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Message Architecture"
        title="La Voz de KCE"
        description="Aquí configuras exactamente lo que dicen tus Agentes y tus operadores. Cada palabra importa. Optimiza regularmente para ver qué copy convierte mejor."
        actions={[{ href: '/admin/outbound', label: 'Ver Bandeja de Salida', tone: 'primary' }]}
        signals={templateSignals}
      />

      {/* EDITOR */}
      <div className="overflow-hidden rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-6 py-6 sm:flex-row sm:items-center md:px-10">
          <div className="flex items-center gap-3">
            <Type className="h-6 w-6 text-brand-blue" />
            <div>
              <h2 className="font-heading text-2xl text-[color:var(--color-text)]">
                Editor Activo
              </h2>
              <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
                Variables: {'{name}, {tour}, {date}, {people}, {checkout_url}'}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={optimizeAB}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-brand-yellow/30 bg-brand-yellow/20 px-4 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)] transition hover:bg-brand-yellow/30"
            >
              <Sparkles className="h-3 w-3" /> A/B Test
            </button>
            <button
              onClick={saveDraft}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-md transition hover:scale-105"
            >
              <Save className="h-3 w-3" /> {draft.id ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>

        {msg && (
          <div className="mx-6 mt-6 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 md:mx-10">
            <CheckCircle2 className="h-4 w-4" /> {msg}
          </div>
        )}
        {testResult && (
          <div className="mx-6 mt-6 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-sm font-medium text-brand-blue md:mx-10">
            {testResult}
          </div>
        )}

        <div className="space-y-6 p-6 md:p-10">
          <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-5">
            <label className="xl:col-span-2">
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Clave (Key)
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-brand-blue"
                value={draft.key || ''}
                onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                placeholder="deal.followup.checkout"
              />
            </label>
            <label>
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Idioma
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-4 py-3 text-center text-sm uppercase outline-none transition-colors focus:border-brand-blue"
                value={draft.locale || ''}
                onChange={(e) => setDraft({ ...draft, locale: e.target.value })}
                placeholder="es, en, fr..."
              />
            </label>
            <label>
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Canal
              </div>
              <select
                className="w-full cursor-pointer appearance-none rounded-xl border border-[color:var(--color-border)] bg-transparent px-4 py-3 text-sm capitalize outline-none transition-colors focus:border-brand-blue"
                value={draft.channel || 'whatsapp'}
                onChange={(e) => setDraft({ ...draft, channel: e.target.value as any })}
              >
                {channelOptions.map((c) => (
                  <option
                    key={c}
                    value={c}
                  >
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Activo
              </div>
              <div className="flex h-[46px] items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-transparent">
                <input
                  type="checkbox"
                  checked={Boolean(draft.enabled ?? true)}
                  onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                  className="h-5 w-5 cursor-pointer accent-brand-blue"
                />
              </div>
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <label className="md:col-span-2">
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Asunto (Solo Email)
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-brand-blue disabled:bg-[color:var(--color-surface-2)] disabled:opacity-50"
                value={draft.subject ?? ''}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value || null })}
                placeholder="Confirma tu reserva de {tour}"
                disabled={draft.channel === 'whatsapp'}
              />
            </label>
            <label>
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Variante (A/B)
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-4 py-3 text-center text-sm uppercase outline-none transition-colors focus:border-brand-blue"
                value={draft.variant || 'A'}
                onChange={(e) => setDraft({ ...draft, variant: e.target.value || 'A' })}
                placeholder="A"
              />
            </label>
            <label>
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Peso (Distribución)
              </div>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-4 py-3 text-center text-sm outline-none transition-colors focus:border-brand-blue"
                value={Number(draft.weight ?? 1)}
                onChange={(e) =>
                  setDraft({ ...draft, weight: Math.max(1, Number(e.target.value || 1)) })
                }
              />
            </label>
          </div>

          <label className="block">
            <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
              Cuerpo del Mensaje
            </div>
            <textarea
              className="min-h-[200px] w-full resize-y rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-4 text-sm font-light leading-relaxed shadow-inner outline-none transition-colors focus:border-brand-blue"
              value={draft.body || ''}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="Escribe el texto aquí..."
            />
          </label>
        </div>
      </div>

      {/* CATÁLOGO DE PLANTILLAS */}
      <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm md:p-8">
        <div className="mb-8 flex flex-col items-end justify-between gap-4 border-b border-[color:var(--color-border)] pb-6 sm:flex-row">
          <div className="grid w-full gap-4 sm:w-auto sm:grid-cols-3">
            <label>
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Filtrar Key
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-brand-blue"
                value={qKey}
                onChange={(e) => setQKey(e.target.value)}
                placeholder="Ej: deal."
              />
            </label>
            <label>
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Filtrar Idioma
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-center text-sm uppercase outline-none focus:border-brand-blue"
                value={qLocale}
                onChange={(e) => setQLocale(e.target.value)}
                placeholder="ES"
              />
            </label>
            <label>
              <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-widest">
                Filtrar Canal
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm capitalize outline-none focus:border-brand-blue"
                value={qChannel}
                onChange={(e) => setQChannel(e.target.value)}
                placeholder="Email / WhatsApp"
              />
            </label>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
              <tr className="text-[color:var(--color-text)]/50 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-5">Plantilla</th>
                <th className="px-6 py-5 text-center">Detalles</th>
                <th className="px-6 py-5 text-center">Performance A/B</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[color:var(--color-surface)]">
              {filtered.map((it) => {
                const isWa = it.channel === 'whatsapp';
                const Icon = isWa ? MessageCircle : Mail;
                const k = `${it.key}|${it.channel}|${it.locale}`;
                const p = perf[k];
                const w = p?.winner ?? null;
                const top = p?.variants?.[0];
                const paidPct = top?.paidRate != null ? `${(top.paidRate * 100).toFixed(1)}%` : '—';
                const sent = top?.sent ?? 0;

                return (
                  <tr
                    key={it.id}
                    className="hover:bg-[color:var(--color-surface-2)]/50 transition-colors"
                  >
                    <td className="px-6 py-5 align-top">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon
                          className={`h-4 w-4 ${isWa ? 'text-emerald-500' : 'text-brand-blue'}`}
                        />
                        <span className="font-heading text-lg text-[color:var(--color-text)]">
                          {it.key}
                        </span>
                      </div>
                      <div className="text-[color:var(--color-text)]/50 mt-1 font-mono text-[10px]">
                        ID: {it.id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center align-top">
                      <div className="mb-2 flex justify-center gap-2">
                        <span className="text-[color:var(--color-text)]/70 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                          {it.locale}
                        </span>
                        <span className="rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                          Var {it.variant}
                        </span>
                      </div>
                      {it.enabled ? (
                        <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                          Activo (Peso: {it.weight})
                        </div>
                      ) : (
                        <div className="text-[9px] font-bold uppercase tracking-widest text-rose-600">
                          Inactivo
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5 text-center align-top">
                      {w ? (
                        <div className="inline-block min-w-[140px] rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-3 text-center">
                          <div className="text-[color:var(--color-text)]/50 mb-1 text-[9px] font-bold uppercase tracking-widest">
                            Winner
                          </div>
                          <div className="font-heading text-xl text-[color:var(--color-text)]">
                            {w}
                          </div>
                          <div className="text-[color:var(--color-text)]/70 mt-1 text-[10px] font-bold uppercase tracking-widest">
                            {paidPct} conv. · {sent} envíos
                          </div>
                        </div>
                      ) : (
                        <span className="text-[color:var(--color-text)]/30 text-xs italic">—</span>
                      )}
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => edit(it)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark text-brand-yellow shadow-sm transition hover:scale-105"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const email = prompt('Email destino para prueba:');
                            if (!email) return;
                            setTestResult('Enviando...');
                            const res = await adminFetch('/api/admin/templates/test-send', {
                              method: 'POST',
                              body: JSON.stringify({ templateId: it.id, toEmail: email }),
                            });
                            const d = await res.json();
                            setTestResult(
                              d.ok ? `Prueba enviada a ${email} ✅` : `Error: ${d.error} ❌`,
                            );
                            setTimeout(() => setTestResult(null), 6000);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/5 text-brand-blue transition hover:bg-brand-blue/10"
                          title="Probar Envío"
                        >
                          <TestTube className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => del(it.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center text-sm font-medium text-[color:var(--color-text-muted)]"
                  >
                    No se encontraron plantillas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
