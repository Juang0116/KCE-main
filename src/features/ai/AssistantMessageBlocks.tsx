import React from 'react';

import { ChatMarkdown } from '@/components/ChatMarkdown';

type SectionKey = 'summary' | 'status' | 'options' | 'plan' | 'next' | 'continuity' | 'other';

type Section = {
  key: SectionKey;
  title: string;
  body: string;
};

function cleanHeading(line: string) {
  return line
    .trim()
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\*\*/, '')
    .replace(/\*\*:?$/, '')
    .replace(/:$/, '')
    .trim();
}

function detectHeading(line: string): { key: SectionKey; title: string } | null {
  const value = cleanHeading(line).toLowerCase();
  if (!value) return null;
  if (['resumen', 'summary'].includes(value)) return { key: 'summary', title: 'Resumen' };
  if (['estado', 'status'].includes(value)) return { key: 'status', title: 'Estado' };
  if (['opciones', 'options'].includes(value)) return { key: 'options', title: 'Opciones recomendadas' };
  if (value.startsWith('plan día') || value.startsWith('plan dia') || value === 'itinerario' || value === 'plan de viaje') {
    return { key: 'plan', title: 'Tu Plan de Viaje' };
  }
  if (['siguiente paso', 'next step', 'prochain pas', 'nächster schritt'].includes(value)) {
    return { key: 'next', title: 'Siguiente paso' };
  }
  if (
    [
      'continuidad',
      'contacto',
      'contact',
      'handoff',
      'continuity',
      'ayuda humana',
      'human handoff',
      'support handoff',
    ].includes(value)
  ) {
    return { key: 'continuity', title: 'Continuidad con KCE' };
  }
  return null;
}

function parseSections(content: string) {
  const lines = String(content || '').split(/\r?\n/);
  const sections: Section[] = [];
  const preamble: string[] = [];
  let current: { key: SectionKey; title: string; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const body = current.lines.join('\n').trim();
    sections.push({
      key: current.key,
      title: current.title,
      body,
    });
    current = null;
  };

  for (const raw of lines) {
    const heading = detectHeading(raw);
    if (heading) {
      flush();
      current = { ...heading, lines: [] };
      continue;
    }
    if (current) current.lines.push(raw);
    else preamble.push(raw);
  }
  flush();

  const sectionMap = new Map<SectionKey, Section>();
  for (const section of sections) {
    if (!sectionMap.has(section.key)) sectionMap.set(section.key, section);
    else {
      const prev = sectionMap.get(section.key)!;
      const mergedBody = [prev.body, section.body].filter(Boolean).join('\n\n').trim();
      sectionMap.set(section.key, {
        key: section.key,
        title: prev.title,
        body: mergedBody,
      });
    }
  }

  return {
    preamble: preamble.join('\n').trim(),
    summary: sectionMap.get('summary') || null,
    status: sectionMap.get('status') || null,
    options: sectionMap.get('options') || null,
    plan: sectionMap.get('plan') || null,
    next: sectionMap.get('next') || null,
    continuity: sectionMap.get('continuity') || null,
    hasStructure: sections.length > 0,
  };
}

function detectFocus(content: string) {
  const lower = String(content || '').toLowerCase();
  if (/ticket|soporte|humano|support/.test(lower)) return 'Soporte';
  if (/checkout|booking|reserva|pago|payment/.test(lower)) return 'Booking';
  if (/plan personalizado|personalized plan|persönlichen plan|plan/i.test(lower)) return 'Plan';
  if (/tour|catálogo|catalog|destino|destination/.test(lower)) return 'Tours';
  return null;
}

export function AssistantMessageBlocks({ content }: { content: string }) {
  const parsed = React.useMemo(() => parseSections(content), [content]);
  const focus = React.useMemo(() => detectFocus(content), [content]);
  
  const chips = [
    focus,
    parsed.plan ? 'Itinerario' : null,
    parsed.options ? 'Opciones' : null,
    parsed.next ? 'Siguiente paso' : null,
    parsed.continuity ? 'Continuidad' : null,
  ].filter(Boolean) as string[];

  if (!parsed.hasStructure) {
    return <ChatMarkdown content={content} />;
  }

  return (
    <div className="space-y-3 text-sm leading-6">
      {chips.length ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text)]/60"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {parsed.preamble ? (
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
          <ChatMarkdown content={parsed.preamble} />
        </div>
      ) : null}

      {parsed.summary ? (
        <div className="rounded-2xl border border-brand-blue/15 bg-brand-blue/5 px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-blue/75">{parsed.summary.title}</div>
          <ChatMarkdown content={parsed.summary.body} />
        </div>
      ) : null}

      {parsed.status ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">{parsed.status.title}</div>
          <ChatMarkdown content={parsed.status.body} />
        </div>
      ) : null}

      {/* AQUÍ ESTÁ EL ARREGLO: Toda la sección de opciones se pinta en un solo bloque unificado */}
      {parsed.options ? (
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/45">{parsed.options.title}</div>
          <ChatMarkdown content={parsed.options.body} />
        </div>
      ) : null}

      {parsed.plan ? (
        <div className="overflow-hidden rounded-2xl border-2 border-brand-blue/20 bg-[color:var(--color-surface)]">
          <div className="bg-brand-blue/90 px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-yellow">
              🗓 {parsed.plan.title}
            </div>
          </div>
          <div className="px-4 py-3">
            <ChatMarkdown content={parsed.plan.body} />
          </div>
        </div>
      ) : null}

      {parsed.next ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">{parsed.next.title}</div>
          <ChatMarkdown content={parsed.next.body} />
        </div>
      ) : null}

      {parsed.continuity ? (
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/45">{parsed.continuity.title}</div>
          <ChatMarkdown content={parsed.continuity.body} />
        </div>
      ) : null}
    </div>
  );
}