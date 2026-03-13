import FinalCommandCenterDeck from '@/components/admin/FinalCommandCenterDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';

export const dynamic = 'force-dynamic';

const quickLinks = [
  { href: '/admin/qa', label: 'QA truth', tone: 'primary' as const },
  { href: '/admin/revenue', label: 'Revenue' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/marketing', label: 'Marketing' },
  { href: '/admin/sales', label: 'Sales' },
];

const focusItems = [
  {
    label: '01 · open',
    title: 'Start from truth, not from noise',
    body: 'Open QA and revenue first. If checkout, booking persistence or traveler assets disagree, do not push harder yet.',
    href: '/admin/qa',
    cta: 'Open QA',
  },
  {
    label: '02 · push',
    title: 'Pressure only the lanes that can still deliver premium',
    body: 'Marketing and sales deserve more pressure only when the promise still feels qualified, clear and recoverable.',
    href: '/admin/marketing',
    cta: 'Open growth lanes',
  },
  {
    label: '03 · protect',
    title: 'Keep post-purchase calm boring',
    body: 'Bookings, account and support should stay calm enough that more volume does not create drama after payment.',
    href: '/admin/bookings',
    cta: 'Review bookings',
  },
];

const notes = [
  {
    title: 'What to scale today',
    body: 'Scale only the lane that still looks clean across QA, revenue and human support.',
  },
  {
    title: 'What to fix today',
    body: 'If one core signal breaks, fix that single blocker before opening new launch work.',
  },
  {
    title: 'What to leave ready tonight',
    body: 'End the day with one next push, one protected lane and one obvious issue already queued.',
  },
];

export default function AdminCommandCenterPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <AdminExecutivePanel
        eyebrow="final command center"
        title="One desk to decide if KCE should push harder today"
        description="This view is now intentionally simpler: open here, confirm system truth fast, choose the one lane to pressure and protect traveler confidence before more demand hits."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <FinalCommandCenterDeck compact title="Command center overview" description="Use this as the executive bridge between growth, close, delivery and recovery without drowning the operator in duplicate decks." />

      <ReleaseGradeDeck
        compact
        title="Release-grade read"
        description="Before scaling campaigns or close pressure, make sure QA, revenue, bookings and account still read as one calm premium system."
      />

      <GoLiveSimplificationDeck
        compact
        title="Operator simplification"
        description="The last sprint here is about reducing noise: fewer competing reads, faster next actions and clearer recovery when something slips."
      />
    </main>
  );
}
