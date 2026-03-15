'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import { Mail, MessageCircle, RefreshCw, Save, Sparkles, TestTube, Trash2, Edit3, Type, CheckCircle2 } from 'lucide-react';
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
    setMsg(''); setLoading(true);
    try {
      const data = await api<{ items: Template[] }>('/api/admin/templates?limit=500');
      setItems(data.items || []);
      try {
        const perfRes = await api<{ items: any[] }>(`/api/admin/templates/perf-summary?days=30&limit=5000`);
        const map: Record<string, any> = {};
        for (const it of perfRes.items || []) {
          map[`${it.key}|${it.channel}|${it.locale}`] = it;
        }
        setPerf(map);
      } catch { setPerf({}); }
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudieron cargar las plantillas.'));
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function saveDraft() {
    setMsg(''); setLoading(true);
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
      setItems((prev) => {
        const idx = prev.findIndex((x) => x.id === res.item.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = res.item; return next; }
        return [res.item, ...prev];
      });
      setDraft({ ...res.item });
      setMsg('Plantilla Guardada ✅');
      setTimeout(()=>setMsg(''), 3000);
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo guardar.'));
    } finally { setLoading(false); }
  }

  async function optimizeAB() {
    setMsg(''); setLoading(true);
    try {
      const res = await api<{ result: any }>('/api/admin/templates/optimize', {
        method: 'POST', body: JSON.stringify({ days: 30, minSamples: 40, lockDays: 7, applyWeights: true }),
      });
      const created = res?.result?.winnersCreated ?? res?.result?.result?.winnersCreated;
      const updated = res?.result?.weightsUpdated ?? res?.result?.result?.weightsUpdated;
      setMsg(`Optimización A/B OK — Winners: ${created ?? 0}, Weights: ${updated ?? 0} ✅`);
      await load();
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo optimizar.'));
    } finally { setLoading(false); }
  }

  function edit(it: Template) { setDraft({ ...it }); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function del(id: string) {
    if (!confirm('¿Seguro que quieres eliminar esta plantilla?')) return;
    setMsg(''); setLoading(true);
    try {
      await api(`/api/admin/templates/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (draft.id === id) setDraft({ key: '', locale: 'es', channel: 'whatsapp', enabled: true, subject: null, body: '' });
      setMsg('Plantilla Eliminada 🗑️');
    } catch (e: any) {
      setMsg(String(e?.message || 'No se pudo eliminar.'));
    } finally { setLoading(false); }
  }

  const templateSignals = useMemo(() => {
    const total = items.length;
    const whatsapps = items.filter(i => i.channel === 'whatsapp').length;
    const emails = items.filter(i => i.channel === 'email').length;
    return [
      { label: 'Plantillas', value: String(total), note: 'Activas en el sistema.' },
      { label: 'Emails', value: String(emails), note: 'Para automatizaciones formales.' },
      { label: 'WhatsApps', value: String(whatsapps), note: 'Para cierres rápidos.' }
    ];
  }, [items]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Playbooks & Plantillas</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
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
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 md:px-10 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Type className="h-6 w-6 text-brand-blue" />
            <div>
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Editor Activo</h2>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mt-1 font-mono">Variables: {'{name}, {tour}, {date}, {people}, {checkout_url}'}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={optimizeAB} disabled={loading} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-yellow/20 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-dark transition hover:bg-brand-yellow/30 border border-brand-yellow/30">
              <Sparkles className="h-3 w-3"/> A/B Test
            </button>
            <button onClick={saveDraft} disabled={loading} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md">
              <Save className="h-3 w-3"/> {draft.id ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>

        {msg && <div className="mx-6 md:mx-10 mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> {msg}</div>}
        {testResult && <div className="mx-6 md:mx-10 mt-6 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-sm font-medium text-brand-blue">{testResult}</div>}

        <div className="p-6 md:p-10 space-y-6">
          <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-5">
            <label className="xl:col-span-2">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Clave (Key)</div>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-3 text-sm font-mono outline-none focus:border-brand-blue transition-colors" value={draft.key || ''} onChange={(e) => setDraft({ ...draft, key: e.target.value })} placeholder="deal.followup.checkout" />
            </label>
            <label>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Idioma</div>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors text-center uppercase" value={draft.locale || ''} onChange={(e) => setDraft({ ...draft, locale: e.target.value })} placeholder="es, en, fr..." />
            </label>
            <label>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Canal</div>
              <select className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors cursor-pointer appearance-none capitalize" value={draft.channel || 'whatsapp'} onChange={(e) => setDraft({ ...draft, channel: e.target.value as any })}>
                {channelOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Activo</div>
              <div className="flex h-[46px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-transparent">
                <input type="checkbox" checked={Boolean(draft.enabled ?? true)} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} className="w-5 h-5 accent-brand-blue cursor-pointer" />
              </div>
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <label className="md:col-span-2">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Asunto (Solo Email)</div>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors disabled:opacity-50 disabled:bg-[var(--color-surface-2)]" value={draft.subject ?? ''} onChange={(e) => setDraft({ ...draft, subject: e.target.value || null })} placeholder="Confirma tu reserva de {tour}" disabled={draft.channel === 'whatsapp'} />
            </label>
            <label>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Variante (A/B)</div>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors text-center uppercase" value={draft.variant || 'A'} onChange={(e) => setDraft({ ...draft, variant: e.target.value || 'A' })} placeholder="A" />
            </label>
            <label>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Peso (Distribución)</div>
              <input type="number" min={1} className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors text-center" value={Number(draft.weight ?? 1)} onChange={(e) => setDraft({ ...draft, weight: Math.max(1, Number(e.target.value || 1)) })} />
            </label>
          </div>

          <label className="block">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Cuerpo del Mensaje</div>
            <textarea className="min-h-[200px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 text-sm font-light leading-relaxed outline-none focus:border-brand-blue transition-colors resize-y shadow-inner" value={draft.body || ''} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Escribe el texto aquí..." />
          </label>
        </div>
      </div>

      {/* CATÁLOGO DE PLANTILLAS */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        <div className="mb-8 flex flex-col sm:flex-row items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div className="grid gap-4 sm:grid-cols-3 w-full sm:w-auto">
            <label>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Filtrar Key</div>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-brand-blue" value={qKey} onChange={(e) => setQKey(e.target.value)} placeholder="Ej: deal." />
            </label>
            <label>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Filtrar Idioma</div>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-brand-blue text-center uppercase" value={qLocale} onChange={(e) => setQLocale(e.target.value)} placeholder="ES" />
            </label>
            <label>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Filtrar Canal</div>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-brand-blue capitalize" value={qChannel} onChange={(e) => setQChannel(e.target.value)} placeholder="Email / WhatsApp" />
            </label>
          </div>
          <button onClick={load} disabled={loading} className="shrink-0 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface-2)] h-[46px]">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Plantilla</th>
                <th className="px-6 py-5 text-center">Detalles</th>
                <th className="px-6 py-5 text-center">Performance A/B</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
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
                  <tr key={it.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-4 w-4 ${isWa ? 'text-emerald-500' : 'text-brand-blue'}`} />
                        <span className="font-heading text-lg text-[var(--color-text)]">{it.key}</span>
                      </div>
                      <div className="text-[10px] text-[var(--color-text)]/50 font-mono mt-1">ID: {it.id.slice(0,8)}</div>
                    </td>

                    <td className="px-6 py-5 align-top text-center">
                      <div className="flex justify-center gap-2 mb-2">
                        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70">{it.locale}</span>
                        <span className="rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-blue">Var {it.variant}</span>
                      </div>
                      {it.enabled ? (
                        <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Activo (Peso: {it.weight})</div>
                      ) : (
                        <div className="text-[9px] text-rose-600 font-bold uppercase tracking-widest">Inactivo</div>
                      )}
                    </td>

                    <td className="px-6 py-5 align-top text-center">
                      {w ? (
                        <div className="inline-block rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-3 text-center min-w-[140px]">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-brand-dark/50 mb-1">Winner</div>
                          <div className="text-xl font-heading text-brand-dark">{w}</div>
                          <div className="text-[10px] text-brand-dark/70 font-bold tracking-widest uppercase mt-1">{paidPct} conv. · {sent} envíos</div>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-text)]/30 italic">—</span>
                      )}
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button onClick={() => edit(it)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark text-brand-yellow transition hover:scale-105 shadow-sm" title="Editar">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={async () => {
                            const email = prompt('Email destino para prueba:');
                            if (!email) return;
                            setTestResult('Enviando...');
                            const res = await adminFetch('/api/admin/templates/test-send', { method: 'POST', body: JSON.stringify({ templateId: it.id, toEmail: email }) });
                            const d = await res.json();
                            setTestResult(d.ok ? `Prueba enviada a ${email} ✅` : `Error: ${d.error} ❌`);
                            setTimeout(() => setTestResult(null), 6000);
                          }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/5 text-brand-blue transition hover:bg-brand-blue/10" title="Probar Envío">
                          <TestTube className="h-4 w-4" />
                        </button>
                        <button onClick={() => del(it.id)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-50 text-rose-600 transition hover:bg-rose-100" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-sm text-[var(--color-text)]/40 font-medium">No se encontraron plantillas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}