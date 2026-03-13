// src/app/admin/conversations/page.tsx
import 'server-only';

import type { Metadata } from 'next';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';

import AdminConversationsClient from './AdminConversationsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Conversaciones | KCE',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/tickets', label: 'Tickets', tone: 'primary' as const },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/ai', label: 'AI desk' },
  { href: '/admin/launch-hq', label: 'Launch HQ' },
  { href: '/admin/command-center', label: 'Command Center' },
];

const focusItems = [
  {
    label: '01 · listen',
    title: 'Read the live signal before it cools down',
    body: 'Conversations are the raw layer of demand and support. Start from the freshest messages and look for the threads that still need action today.',
    href: '/admin/tickets',
    cta: 'Open ticket queue',
  },
  {
    label: '02 · classify',
    title: 'Decide whether the thread belongs to support, sales or recovery',
    body: 'The value of this view is classification speed: ticket, deal, customer context or simple closure — not endless scrolling.',
    href: '/admin/customers',
    cta: 'Open customer context',
  },
  {
    label: '03 · handoff',
    title: 'Keep AI, human follow-up and booking truth connected',
    body: 'When a traveler escalates from chat to human help, the transition should preserve context instead of forcing a restart.',
    href: '/admin/ai',
    cta: 'Review AI lane',
  },
];

const notes = [
  {
    title: 'What matters first',
    body: 'Fresh threads with unresolved intent matter more than archival volume.',
  },
  {
    title: 'What to decide fast',
    body: 'Each useful conversation should end with a clear owner: support, sales, bookings or no action needed.',
  },
  {
    title: 'What good looks like',
    body: 'The best conversation desk feels like signal triage, not chat archaeology.',
  },
];

export default function AdminConversationsPage() {
  return (
    <main className="space-y-6">
      <AdminExecutivePanel
        eyebrow="conversation operating read"
        title="A cleaner live-signal desk for support and sales handoff"
        description="Conversations now open with a simpler reading: detect the threads that still matter, classify them quickly and preserve context as they move into support, deals or recovery."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <ReleaseGradeDeck
        compact
        title="Conversations release-grade read"
        description="Before scale rises, make sure chat signal, AI handoff and human follow-up still stay connected to one traceable customer story."
      />

      <GoLiveSimplificationDeck
        compact
        title="Conversations simplification"
        description="The last gain here is decision speed: less table noise, a clearer live queue and faster routing from message to owner."
      />

      <AdminConversationsClient />
    </main>
  );
}
