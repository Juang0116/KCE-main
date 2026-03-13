import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';

import { AdminMarketingClient } from './AdminMarketingClient';

export const dynamic = 'force-dynamic';

const quickLinks = [
  { href: '/admin/revenue', label: 'Revenue truth', tone: 'primary' as const },
  { href: '/admin/sales', label: 'Sales handoff' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/outbound', label: 'Outbound' },
  { href: '/admin/command-center', label: 'Command Center' },
];

const focusItems = [
  {
    label: '01 · push',
    title: 'Push only the lane that can still close',
    body: 'Traffic pressure matters only when the route still moves into quiz, shortlist, human handoff and premium checkout without losing quality.',
    href: '/admin/revenue',
    cta: 'Check revenue',
  },
  {
    label: '02 · fix',
    title: 'Repair the bottleneck before publishing more',
    body: 'If lead capture, CTA continuity or handoff quality weakens, fix that bottleneck before asking growth to compensate with more traffic.',
    href: '/admin/templates',
    cta: 'Adjust message system',
  },
  {
    label: '03 · align',
    title: 'Keep growth language consistent until close',
    body: 'Market pages, tours, outbound and sales should repeat the same promise so the visitor hears one premium story from click to booking.',
    href: '/admin/sales',
    cta: 'Open sales handoff',
  },
];

const notes = [
  {
    title: 'Scale today',
    body: 'Scale the lane that still converts with clean intent, not the one that only makes dashboards look busy.',
  },
  {
    title: 'Protect today',
    body: 'Protect CTA continuity from discover to checkout before adding more campaign complexity.',
  },
  {
    title: 'Publish today',
    body: 'Publish content that strengthens a winning lane or repairs a weak handoff, not generic volume for its own sake.',
  },
];

export default function AdminMarketingPage() {
  return (
    <main className="space-y-6 px-4 py-6 md:px-6">
      <AdminExecutivePanel
        eyebrow="marketing operating read"
        title="A clearer growth desk for international demand"
        description="Marketing now works as a cleaner decision page: detect the lane with signal, fix the true bottleneck and keep growth language aligned with close and post-purchase reality."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <ReleaseGradeDeck
        compact
        title="Marketing release-grade read"
        description="Before traffic grows, make sure capture, handoff and checkout continuity still feel qualified enough for a premium promise."
      />

      <GoLiveSimplificationDeck
        compact
        title="Marketing simplification"
        description="The final gain here is decision speed: fewer competing decks, a cleaner read of the funnel and clearer next actions for growth."
      />

      <AdminMarketingClient />
    </main>
  );
}
