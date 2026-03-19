'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { ChevronRight, LayoutDashboard, Sparkles } from 'lucide-react';
import BlockTracker from '@/components/analytics/BlockTracker';

type QuickLink = {
  href: string;
  label: string;
  tone?: 'primary' | 'default';
};

type FocusItem = {
  label: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
};

type NoteItem = {
  title: string;
  body: string;
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  quickLinks: QuickLink[];
  focusItems: FocusItem[];
  notes?: NoteItem[];
  pageContext?: string;
};

export default function TravelerExecutivePanel({
  eyebrow,
  title,
  description,
  quickLinks,
  focusItems,
  notes = [],
  pageContext = 'executive.panel',
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-brand-blue/10 bg-white p-8 shadow-pop md:p-12">
      {/* Telemetría Ejecutiva: Mide el impacto visual de la sección */}
      <BlockTracker page={pageContext} block="main_executive_header" />

      <header className="relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5 fill-brand-blue/20" />
          {eyebrow}
        </div>
        
        <h1 className="font-heading text-4xl font-bold tracking-tight text-brand-blue md:text-6xl lg:max-w-4xl">
          {title}
        </h1>
        
        <p className="max-w-3xl text-base leading-relaxed text-muted md:text-lg">
          {description}
        </p>

        {/* Quick Actions Bar con Atribución */}
        <div className="flex flex-wrap gap-3 pt-4">
          {quickLinks.map((link) => (
            <Link
              key={`${link.href}:${link.label}`}
              href={link.href}
              data-cta={`exec_quicklink_${link.label.toLowerCase().replace(/\s+/g, '_')}`}
              className={clsx(
                'inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold transition-all duration-300',
                link.tone === 'primary'
                  ? 'bg-brand-blue text-white shadow-lg hover:shadow-brand-blue/20 hover:-translate-y-0.5'
                  : 'border border-brand-dark/10 bg-brand-dark/5 text-brand-blue hover:bg-brand-dark/10'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Focus Grid: Los tres pilares de acción inmediata */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {focusItems.map((item) => (
          <article
            key={`${item.label}:${item.title}`}
            className="group flex flex-col rounded-[2rem] border border-brand-dark/5 bg-brand-dark/[0.02] p-8 transition-all duration-300 hover:bg-white hover:shadow-soft"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted/60">
              {item.label}
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold text-brand-blue">
              {item.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
              {item.body}
            </p>
            {item.href && item.cta && (
              <Link
                href={item.href}
                data-cta={`exec_focus_${item.cta.toLowerCase().replace(/\s+/g, '_')}`}
                className="mt-8 inline-flex items-center gap-1 text-xs font-bold text-brand-blue transition-colors hover:text-brand-yellow"
              >
                {item.cta}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </article>
        ))}
      </div>

      {/* Footer Notes: Contexto adicional para la toma de decisiones */}
      {notes.length > 0 && (
        <div className="mt-10 grid gap-6 border-t border-brand-dark/5 pt-10 md:grid-cols-3">
          {notes.map((note) => (
            <div key={note.title} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-blue/50">
                {note.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted/80">
                {note.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Marca de agua sutil para identidad visual */}
      <div className="absolute -right-20 -top-20 opacity-[0.03] pointer-events-none select-none">
        <LayoutDashboard size={400} />
      </div>
    </section>
  );
}