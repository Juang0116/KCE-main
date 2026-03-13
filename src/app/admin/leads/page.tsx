import 'server-only';

import type { Metadata } from 'next';

import { CommercialControlDeck } from '@/components/admin/CommercialControlDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';

import { AdminLeadsClient } from './AdminLeadsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Leads | KCE',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/deals', label: 'Deals', tone: 'primary' as const },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/outbound', label: 'Outbound' },
  { href: '/admin/revenue', label: 'Revenue' },
];

const focusItems = [
  {
    label: '01 · qualify',
    title: 'Convert signal into a real next move fast',
    body: 'A lead should quickly leave ambiguity behind: qualify it, assign an owner and decide whether the next path is deal, nurture or human help.',
    href: '/admin/deals',
    cta: 'Open pipeline',
  },
  {
    label: '02 · protect',
    title: 'Do not let fresh intent die in admin noise',
    body: 'When the lead already carries channel, source and traveler intent, the desk should accelerate handoff instead of storing passive records.',
    href: '/admin/sales',
    cta: 'Open sales handoff',
  },
  {
    label: '03 · verify',
    title: 'Reconnect intake with downstream truth',
    body: 'The leads desk only wins when the same signal later shows up in deals, outbound pressure and revenue movement without losing context.',
    href: '/admin/revenue',
    cta: 'Review revenue truth',
  },
];

const notes = [
  {
    title: 'What matters first',
    body: 'A clear next owner and next step matter more than collecting more lead metadata.',
  },
  {
    title: 'What to avoid',
    body: 'Do not leave qualified leads parked without a path into deals, outbound or customer conversion.',
  },
  {
    title: 'What good looks like',
    body: 'A strong intake desk feels fast, deliberate and connected to the rest of the commercial engine.',
  },
];

export default function AdminLeadsPage() {
  return (
    <main className="space-y-6">
      <CommercialControlDeck
        eyebrow="Lead Intake Desk"
        title="CRM · Leads"
        description="Leads now open as a clearer intake desk: qualify faster, assign a next move early and keep the signal connected to deals, outbound and revenue truth."
        primaryHref="/admin/deals"
        primaryLabel="Abrir pipeline"
        secondaryHref="/admin/sales"
        secondaryLabel="Abrir sales"
      />

      <AdminExecutivePanel
        eyebrow="lead operating read"
        title="A simpler intake desk for fast qualification and cleaner handoff"
        description="This page now starts with operator clarity: sort fresh intent fast, move the right leads into pipeline and protect the context that sales, support and revenue still need later."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <AdminOperatorWorkbench
        eyebrow="today's intake loop"
        title="Decide the next move before the signal cools"
        description="Use this desk to separate leads that deserve immediate pipeline pressure from the ones that need nurture, cleanup or customer conversion before the opportunity gets noisy."
        actions={[
          { href: '/admin/deals', label: 'Move hottest leads', tone: 'primary' },
          { href: '/admin/customers', label: 'Review converted contacts' },
          { href: '/admin/outbound', label: 'Open follow-up engine' },
          { href: '/admin/sequences', label: 'Open nurture sequences' },
        ]}
        signals={[
          { label: 'qualify', value: 'today', note: 'Push fresh intent into a real stage with owner and next action.' },
          { label: 'convert', value: 'fast', note: 'Turn clean leads into customers when the path is already obvious.' },
          { label: 'handoff', value: 'clean', note: 'Preserve notes, tags and source so downstream teams do not lose context.' },
          { label: 'verify', value: 'later', note: 'Come back from deals and revenue to confirm the signal really moved.' },
        ]}
      />

      <ReleaseGradeDeck
        compact
        title="Leads release-grade read"
        description="Before scaling more traffic, make sure lead qualification, ownership and conversion paths still feel deliberate and easy to operate."
      />

      <GoLiveSimplificationDeck
        compact
        title="Leads simplification"
        description="The final gain here is intake speed: fewer repeated blocks, clearer first actions and a stronger bridge from signal to close."
      />

      <AdminLeadsClient />
    </main>
  );
}
