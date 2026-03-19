'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { ArrowRight, Activity } from 'lucide-react';
import BlockTracker from '@/components/analytics/BlockTracker';

type QuickAction = {
  href: string;
  label: string;
  tone?: 'primary' | 'default';
};

type Signal = {
  label: string;
  value: string;
  note: string;
  trend?: 'up' | 'down' | 'stable';
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: QuickAction[];
  signals?: Signal[];
  pageContext?: string; // Para telemetría
};

export default function TravelerActionWorkbench({
  eyebrow,
  title,
  description,
  actions = [],
  signals = [],
  pageContext = 'admin.workbench',
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-brand-dark/10 bg-white p-6 shadow-soft transition-all hover:shadow-hard md:p-8">
      {/* Telemetría: Rastrea qué workbench está viendo el admin */}
      <BlockTracker page={pageContext} block={title.toLowerCase().replace(/\s+/g, '_')} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/70">
            <Activity className="h-3 w-3" />
            {eyebrow}
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-brand-blue md:text-3xl">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted md:text-base">
            {description}
          </p>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {actions.map((action) => (
              <Link
                key={`${action.href}:${action.label}`}
                href={action.href}
                data-cta={`workbench_${action.label.toLowerCase().replace(/\s+/g, '_')}`}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-200 active:scale-95',
                  action.tone === 'primary'
                    ? 'bg-brand-blue text-white shadow-sm hover:bg-brand-blue/90 hover:shadow-md'
                    : 'border border-brand-dark/10 bg-brand-dark/5 text-brand-blue hover:bg-brand-dark/10'
                )}
              >
                {action.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {signals.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {signals.map((signal) => (
            <article
              key={`${signal.label}:${signal.value}`}
              className="group rounded-2xl border border-brand-dark/5 bg-brand-dark/[0.02] p-5 transition-colors hover:bg-brand-blue/[0.03]"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60 group-hover:text-brand-blue/60">
                {signal.label}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-brand-blue">
                  {signal.value}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted/80">
                {signal.note}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}