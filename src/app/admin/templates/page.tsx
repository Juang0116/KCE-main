import 'server-only';

import type { Metadata } from 'next';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import { requireAdmin } from '@/lib/adminGuard';

import { AdminTemplatesClient } from './AdminTemplatesClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Templates | KCE',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/outbound', label: 'Outbound', tone: 'primary' as const },
  { href: '/admin/sequences', label: 'Sequences' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/revenue', label: 'Revenue' },
];

const focusItems = [
  {
    label: '01 · clarify',
    title: 'Start with the messages closest to money and trust',
    body: 'Proposal, checkout and recovery copy deserve the first attention block because they shape the traveler decision at the most fragile point of the funnel.',
    href: '/admin/revenue',
    cta: 'Review conversion truth',
  },
  {
    label: '02 · align',
    title: 'Keep copy consistent across outbound, sequences and sales',
    body: 'Templates matter only when the promise sounds coherent from the first follow-up to the final handoff into booking and support.',
    href: '/admin/outbound',
    cta: 'Open outbound desk',
  },
  {
    label: '03 · refine',
    title: 'Use testing to sharpen, not to create noise',
    body: 'A/B work should reinforce a winning lane, remove weak variants and support real close pressure instead of endless experimentation.',
    href: '/admin/sequences',
    cta: 'Open sequence system',
  },
];

const notes = [
  {
    title: 'What wins today',
    body: 'The best copy usually removes one decisive objection instead of saying more words.',
  },
  {
    title: 'What to avoid',
    body: 'Do not optimize secondary templates before checkout, proposal and rescue copy feel truly strong.',
  },
  {
    title: 'What good looks like',
    body: 'A premium message system sounds consistent, intentional and easy for the operator to deploy fast.',
  },
];

export default async function AdminTemplatesPage() {
  await requireAdmin();

  return (
    <main className="space-y-6">
      <AdminExecutivePanel
        eyebrow="template operating read"
        title="A cleaner message system for close pressure, recovery and trust"
        description="Templates now open as a sharper operator desk: strengthen the copy that influences decision, keep language aligned across the funnel and use testing to refine winners instead of multiplying noise."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <AdminOperatorWorkbench
        eyebrow="today's copy loop"
        title="Refine the message that can still change the decision"
        description="Use this desk to sharpen proposal, checkout and rescue copy first, then verify in outbound, sequences and revenue whether the message actually reduced friction or moved the opportunity."
        actions={[
          { href: '/admin/outbound', label: 'Deploy in outbound', tone: 'primary' },
          { href: '/admin/sequences', label: 'Propagate to sequences' },
          { href: '/admin/sales', label: 'Check seller fit' },
          { href: '/admin/revenue', label: 'Check business impact' },
        ]}
        signals={[
          { label: 'proposal', value: 'strong', note: 'Clarify value and next action before polishing secondary copy.' },
          { label: 'checkout', value: 'clear', note: 'Reduce final friction with trust, simplicity and direct guidance.' },
          { label: 'recovery', value: 'new angle', note: 'Recover attention with a better hook, not repetition.' },
          { label: 'testing', value: 'disciplined', note: 'Keep winners, retire weak variants and stay tied to real results.' },
        ]}
      />

      <ReleaseGradeDeck
        compact
        title="Templates release-grade read"
        description="Before scaling message volume, make sure the strongest templates still sound premium, coherent and connected to real close outcomes."
      />

      <GoLiveSimplificationDeck
        compact
        title="Templates simplification"
        description="The last improvement here is copy discipline: less duplicated explanation, clearer message priorities and faster deployment into the commercial loop."
      />

      <AdminTemplatesClient />
    </main>
  );
}
