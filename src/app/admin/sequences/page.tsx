import 'server-only';

import type { Metadata } from 'next';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';

import { AdminSequencesClient } from './AdminSequencesClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Sequences | KCE',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/templates', label: 'Templates', tone: 'primary' as const },
  { href: '/admin/outbound', label: 'Outbound' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/revenue', label: 'Revenue' },
];

const focusItems = [
  {
    label: '01 · sustain',
    title: 'Use cadence only when the opportunity still deserves pressure',
    body: 'A sequence should reinforce a believable commercial path, not automate noise around a deal that already lost fit or urgency.',
    href: '/admin/deals',
    cta: 'Review deal context',
  },
  {
    label: '02 · align',
    title: 'Keep steps, message and channel working together',
    body: 'Sequences become useful only when each step uses the right template, right timing and right escalation path into human outbound.',
    href: '/admin/templates',
    cta: 'Align templates',
  },
  {
    label: '03 · verify',
    title: 'Cut or refine the cadence when impact is weak',
    body: 'If the sequence does not improve replies, proposal momentum or paid truth, simplify it before sending more volume through automation.',
    href: '/admin/revenue',
    cta: 'Check impact',
  },
];

const notes = [
  {
    title: 'What wins today',
    body: 'A small number of strong sequences with clear intent beats a large library of passive automations.',
  },
  {
    title: 'What to avoid',
    body: 'Do not leave long drip systems running when the opportunity really needs a human message or a sharper offer.',
  },
  {
    title: 'What good looks like',
    body: 'A healthy cadence system feels intentional, measurable and easy to switch back into human pressure when needed.',
  },
];

export default function AdminSequencesPage() {
  return (
    <main className="space-y-6 px-4 py-6 md:px-6">
      <AdminExecutivePanel
        eyebrow="sequence operating read"
        title="A simpler cadence desk for sustained pressure and cleaner automation"
        description="Sequences now open with a cleaner operator read: keep only the cadences that still support a real close path, align them with the right message system and cut automation that no longer moves the funnel."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <AdminOperatorWorkbench
        eyebrow="today's cadence loop"
        title="Automate only what still deserves rhythm"
        description="Use this desk to keep proposal and checkout momentum alive when discipline helps, then return quickly to outbound or sales when the opportunity needs a more human push."
        actions={[
          { href: '/admin/templates', label: 'Refine sequence copy', tone: 'primary' },
          { href: '/admin/outbound', label: 'Escalate to outbound' },
          { href: '/admin/sales', label: 'Check close pressure' },
          { href: '/admin/revenue', label: 'Measure effect' },
        ]}
        signals={[
          { label: 'active', value: 'clear', note: 'Keep active sequences tied to a visible stage and real objective.' },
          { label: 'timing', value: 'tight', note: 'Cadence should feel disciplined, not mechanically delayed for no reason.' },
          { label: 'handoff', value: 'human', note: 'Escalate quickly when a reply or objection needs a person, not another drip step.' },
          { label: 'impact', value: 'real', note: 'Replies, progression and paid truth matter more than enrollments alone.' },
        ]}
      />

      <ReleaseGradeDeck
        compact
        title="Sequences release-grade read"
        description="Before relying harder on automation, make sure cadence, copy and human escalation still reinforce the same premium close path."
      />

      <GoLiveSimplificationDeck
        compact
        title="Sequences simplification"
        description="The last gain here is automation clarity: fewer repeated explanations, stronger rhythm decisions and faster fallback to the right human action."
      />

      <AdminSequencesClient />
    </main>
  );
}
