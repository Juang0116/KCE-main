import { AdminAnalyticsClient } from './AdminAnalyticsClient';

export const dynamic = 'force-dynamic';

export default function AdminAnalyticsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold">Analytics ejecutivo</h1>
      <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
        CAC/ROAS/LTV + cohortes (P78). Para CAC/ROAS, carga spend diario.
      </p>
      <div className="mt-4">
        <AdminAnalyticsClient />
      </div>
    </div>
  );
}
