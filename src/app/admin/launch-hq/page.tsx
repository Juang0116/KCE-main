import ExecutiveLaunchHQDeck from '@/components/admin/ExecutiveLaunchHQDeck';
import WorldClassGoLiveDeck from '@/components/admin/WorldClassGoLiveDeck';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';

export const dynamic = 'force-dynamic';

const quickLinks = [
  { href: '/admin/command-center', label: 'Command Center' },
  { href: '/admin/qa', label: 'QA truth' },
  { href: '/admin/revenue', label: 'Revenue truth', tone: 'primary' as const },
  { href: '/admin/marketing', label: 'Marketing' },
  { href: '/admin/sales', label: 'Sales' },
];

const focusItems = [
  {
    label: '01 · verify',
    title: 'Start from QA and revenue',
    body: 'If checkout, booking persistence and delivery assets disagree, hold traffic and fix the mismatch first.',
    href: '/admin/qa',
    cta: 'Verify system truth',
  },
  {
    label: '02 · decide',
    title: 'Choose one traffic lane to pressure',
    body: 'Push only the market or sales lane that still feels premium, qualified and operationally recoverable.',
    href: '/admin/marketing',
    cta: 'Choose traffic lane',
  },
  {
    label: '03 · protect',
    title: 'Leave post-purchase calm intact',
    body: 'Bookings and support should stay easy to reopen after payment so the launch feels premium after the click too.',
    href: '/admin/bookings',
    cta: 'Protect bookings',
  },
];

const notes = [
  {
    title: 'Scale today',
    body: 'Only scale the lane with clean acquisition, clear close authority and calm support behind it.',
  },
  {
    title: 'Protect today',
    body: 'If revenue truth or delivery continuity wobble, recovery speed matters more than more traffic.',
  },
  {
    title: 'Ready tonight',
    body: 'Leave one clear next push and one protected lane so tomorrow opens faster and calmer.',
  },
];

export default function LaunchHqPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <AdminExecutivePanel
        eyebrow="launch hq"
        title="Executive launch headquarters"
        description="Launch HQ now works as a cleaner daily decision page: verify truth, choose the lane to scale and protect the parts of KCE that preserve the premium promise after payment."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <ExecutiveLaunchHQDeck compact description="Use Launch HQ to decide where traffic should go today, which lane needs protection and what must be confirmed before more demand hits the system." />

      <WorldClassGoLiveDeck compact title="Go-live final read" description="A strong launch deserves more demand only when growth, close, payment, delivery and support still feel coordinated and premium." />

      <GoLiveSimplificationDeck
        compact
        title="Simplify launch operations"
        description="The final gain here is clarity: fewer panels to scan, a faster launch read and a much more obvious recovery path when anything breaks."
      />
    </main>
  );
}
