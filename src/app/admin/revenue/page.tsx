import 'server-only';

import type { Metadata } from 'next';

import { CommercialControlDeck } from '@/components/admin/CommercialControlDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';

import { AdminRevenueOpsClient } from './AdminRevenueOpsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Revenue Ops | KCE',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/bookings', label: 'Bookings', tone: 'primary' as const },
  { href: '/admin/qa', label: 'QA' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/outbound', label: 'Outbound' },
  { href: '/admin/deals', label: 'Deals' },
];

const focusItems = [
  {
    label: '01 · detect',
    title: 'Find the most expensive leak first',
    body: 'Revenue should tell you where money is stalling now: proposal, checkout, delivery continuity or recovery.',
    href: '/admin/deals',
    cta: 'Open deals',
  },
  {
    label: '02 · adjust',
    title: 'Change one revenue lever at a time',
    body: 'Update the template, CTA, sequence or follow-up cadence that matches the bottleneck instead of opening multiple fixes at once.',
    href: '/admin/templates',
    cta: 'Adjust templates',
  },
  {
    label: '03 · verify',
    title: 'Confirm the sale still survives after charge',
    body: 'Bookings, assets and account continuity should support the same promise that checkout just sold.',
    href: '/admin/bookings',
    cta: 'Verify delivery',
  },
];

const notes = [
  {
    title: 'Priority',
    body: 'Proposal and checkout friction matter more than secondary optimization when cash movement is the goal.',
  },
  {
    title: 'Recovery',
    body: 'Recovery only deserves effort when there is still a credible path to close or save the booking.',
  },
  {
    title: 'Rhythm',
    body: 'Read revenue in short loops during the day so action happens before the pipeline cools down.',
  },
];

export default function AdminRevenueOpsPage() {
  return (
    <main className="space-y-6">
      <CommercialControlDeck
        eyebrow="Revenue Command"
        title="Revenue Ops"
        description="Revenue, bookings, QA and account should tell the same story so KCE can charge, deliver and recover confidence without friction."
        primaryHref="/admin/bookings"
        primaryLabel="Abrir bookings"
        secondaryHref="/admin/qa"
        secondaryLabel="Abrir QA"
      />

      <AdminExecutivePanel
        eyebrow="revenue operating read"
        title="A cleaner revenue view for daily action"
        description="This page now prioritizes the next move over dashboard noise: detect the expensive leak, change the right lever and verify that premium delivery still matches the sale."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <ReleaseGradeDeck
        compact
        title="Revenue release-grade read"
        description="Before pushing harder, make sure payment truth, booking persistence and account calm still match the premium promise sold in checkout."
      />

      <GoLiveSimplificationDeck
        compact
        title="Revenue simplification"
        description="The final polish here is operational clarity: fewer duplicate reads, faster decisions and an obvious path from signal to action."
      />

      <AdminRevenueOpsClient />
    </main>
  );
}
