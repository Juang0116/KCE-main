import 'server-only';

import type { Metadata } from 'next';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';

import { AdminCustomersClient } from './AdminCustomersClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customers | Admin | KCE',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/deals', label: 'Deals', tone: 'primary' as const },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/tickets', label: 'Tickets' },
  { href: '/admin/segments', label: 'Segments' },
  { href: '/admin/revenue', label: 'Revenue' },
];

const focusItems = [
  {
    label: '01 · identify',
    title: 'Start from the customer records that can move action now',
    body: 'Customer data matters when it helps a live booking, follow-up, support case or commercial recovery move forward today.',
    href: '/admin/deals',
    cta: 'Open deals',
  },
  {
    label: '02 · segment',
    title: 'Save only the filters that improve future action',
    body: 'Segments are useful when they simplify outreach, bookings review or support routing — not when they only create more administrative noise.',
    href: '/admin/segments',
    cta: 'Open segments',
  },
  {
    label: '03 · protect',
    title: 'Keep customer truth aligned across payment, support and handoff',
    body: 'The same customer should feel coherent in bookings, tickets, conversations and post-purchase service.',
    href: '/admin/bookings',
    cta: 'Verify bookings',
  },
];

const notes = [
  {
    title: 'What to prioritize',
    body: 'Prioritize customers tied to live revenue, unresolved support or upcoming delivery over passive database grooming.',
  },
  {
    title: 'What to avoid',
    body: 'Avoid collecting or segmenting data without a concrete operational use inside KCE’s commercial loop.',
  },
  {
    title: 'What good looks like',
    body: 'A strong customer desk feels actionable, segmented with purpose and consistent across every team touchpoint.',
  },
];

export default function AdminCustomersPage() {
  return (
    <main className="space-y-6">
      <AdminExecutivePanel
        eyebrow="customer operating read"
        title="A cleaner customer desk for action, segmentation and continuity"
        description="Customers now open as an operational system: identify the records that matter, segment with intent and keep support, sales and bookings reading the same person clearly."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <ReleaseGradeDeck
        compact
        title="Customers release-grade read"
        description="Before traffic grows, make sure customer identity, segmentation and continuity still support the same premium promise from close to delivery."
      />

      <GoLiveSimplificationDeck
        compact
        title="Customers simplification"
        description="The last improvement here is operational focus: fewer abstract filters, clearer customer context and faster access to the records that actually matter today."
      />

      <AdminCustomersClient />
    </main>
  );
}
