import { CommercialControlDeck } from '@/components/admin/CommercialControlDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import { requireAdmin } from '@/lib/adminGuard';

import { AdminDealsClient } from './AdminDealsClient';

export const dynamic = 'force-dynamic';

const quickLinks = [
  { href: '/admin/deals/board', label: 'Kanban board', tone: 'primary' as const },
  { href: '/admin/sales', label: 'Sales' },
  { href: '/admin/outbound', label: 'Outbound' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/revenue', label: 'Revenue' },
];

const focusItems = [
  {
    label: '01 · close',
    title: 'Push the opportunities that can move cash now',
    body: 'Qualified, proposal and checkout lanes deserve the first action block because they are the closest path from intent to revenue.',
    href: '/admin/revenue',
    cta: 'Review revenue truth',
  },
  {
    label: '02 · rescue',
    title: 'Rescue the deals that still have a believable path',
    body: 'Use follow-up, outbound and message clarity only where timing, fit and traveler intent still suggest a realistic close path.',
    href: '/admin/outbound',
    cta: 'Open outbound',
  },
  {
    label: '03 · verify',
    title: 'Keep the close aligned with handoff and delivery',
    body: 'A deal is not really healthy if sales says yes but bookings, support or account continuity are already drifting apart.',
    href: '/admin/sales',
    cta: 'Open sales handoff',
  },
];

const notes = [
  {
    title: 'What wins today',
    body: 'A smaller number of decisive moves usually matters more than broad passive pipeline grooming.',
  },
  {
    title: 'What to avoid',
    body: 'Do not let qualified or proposal deals sit without a next step, owner or date of revalidation.',
  },
  {
    title: 'What good looks like',
    body: 'The best deals desk feels like controlled forward motion: clear value, clear next move and clear handoff after close.',
  },
];

export default async function AdminDealsPage() {
  await requireAdmin();
  return (
    <main className="space-y-6">
      <CommercialControlDeck
        eyebrow="Closing Cabin"
        title="Deals"
        description="Pipeline de oportunidades: del primer contacto a checkout, cierre y postventa. Usa esta vista para decidir qué deal mover hoy, qué propuesta reforzar y dónde volver a confirmar impacto en outbound y revenue."
        primaryHref="/admin/deals/board"
        primaryLabel="Abrir board kanban"
        secondaryHref="/admin/revenue"
        secondaryLabel="Ver revenue"
      />

      <AdminExecutivePanel
        eyebrow="deals operating read"
        title="A simpler pipeline desk for close pressure and clear next moves"
        description="Deals now start with operator clarity: pressure the lanes closest to payment, rescue only the opportunities that still have energy and keep sales aligned with delivery reality."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <ReleaseGradeDeck
        compact
        title="Deals release-grade read"
        description="Before pushing harder, make sure proposal pressure, checkout movement and post-close continuity still reinforce the same premium system."
      />

      <GoLiveSimplificationDeck
        compact
        title="Deals simplification"
        description="The last gain here is clarity: less dashboard sprawl, faster prioritization and a more obvious path from stage to next action."
      />

      <AdminDealsClient />
    </main>
  );
}
