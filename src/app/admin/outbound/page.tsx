import 'server-only';

import type { Metadata } from 'next';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';

import { AdminOutboundClient } from './AdminOutboundClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Outbound | KCE',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/sales', label: 'Sales', tone: 'primary' as const },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/sequences', label: 'Sequences' },
  { href: '/admin/revenue', label: 'Revenue' },
];

const focusItems = [
  {
    label: '01 · reply',
    title: 'Start with the threads that can move today',
    body: 'Replies, live objections and checkout pressure deserve the first operator block before broad message cleanup or batch work.',
    href: '/admin/sales',
    cta: 'Open sales cockpit',
  },
  {
    label: '02 · rescue',
    title: 'Recover the sends that still have a believable path',
    body: 'Failed or cooling messages matter only when there is still traveler intent worth saving with a better angle, channel or timing.',
    href: '/admin/templates',
    cta: 'Adjust templates',
  },
  {
    label: '03 · confirm',
    title: 'Reconnect message work with revenue truth',
    body: 'Outbound should not feel isolated: after the send, confirm whether the signal moved deals, booking confidence or real payment progress.',
    href: '/admin/revenue',
    cta: 'Check revenue impact',
  },
];

const notes = [
  {
    title: 'What wins today',
    body: 'A real reply or a recovered checkout usually matters more than expanding message volume.',
  },
  {
    title: 'What to avoid',
    body: 'Do not keep blasting generic follow-up when the real issue is a weak offer, weak timing or weak handoff.',
  },
  {
    title: 'What good looks like',
    body: 'The outbound desk should feel like a disciplined close engine, not a noisy message queue.',
  },
];

export default function AdminOutboundPage() {
  return (
    <main className="space-y-6 px-4 py-6 md:px-6">
      <AdminExecutivePanel
        eyebrow="outbound operating read"
        title="A clearer message desk for replies, rescue and close pressure"
        description="Outbound now starts with decision clarity: work the messages that can move today, rescue the few worth saving and confirm real impact in sales and revenue instead of living inside a queue."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <AdminOperatorWorkbench
        eyebrow="today's messaging loop"
        title="Protect momentum before you expand volume"
        description="Use the queue to move active threads, repair the few failed sends that matter and push checkout or recovery only where the next message can still change the outcome."
        actions={[
          { href: '/admin/templates', label: 'Refine copy', tone: 'primary' },
          { href: '/admin/sequences', label: 'Tune sequences' },
          { href: '/admin/deals', label: 'Verify pipeline context' },
          { href: '/admin/revenue', label: 'Verify conversion truth' },
        ]}
        signals={[
          { label: 'replies', value: 'first', note: 'Active conversations deserve priority over cold queue cleanup.' },
          { label: 'checkout', value: 'tight', note: 'Use direct messages to reduce final friction when intent is already visible.' },
          { label: 'recovery', value: 'smart', note: 'Recover only the sends that still have timing, fit and signal behind them.' },
          { label: 'loop', value: 'closed', note: 'After action, return to deals and revenue to confirm the message mattered.' },
        ]}
      />

      <ReleaseGradeDeck
        compact
        title="Outbound release-grade read"
        description="Before pushing more sends, make sure the queue still prioritizes real opportunity, clear copy and visible downstream impact."
      />

      <GoLiveSimplificationDeck
        compact
        title="Outbound simplification"
        description="The last improvement here is message discipline: less dashboard clutter, faster triage and a cleaner path from send to commercial result."
      />

      <AdminOutboundClient />
    </main>
  );
}
