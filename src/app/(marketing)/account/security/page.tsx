/* src/app/(marketing)/account/security/page.tsx */
import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import SecurityCenterView from '@/features/auth/SecurityCenterView';

export const metadata: Metadata = {
  title: 'Centro de seguridad | KCE',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PageShell>
      <SecurityCenterView />
    </PageShell>
  );
}
