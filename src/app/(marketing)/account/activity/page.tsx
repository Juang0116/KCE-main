/* src/app/(marketing)/account/activity/page.tsx */
import 'server-only';

import ActivityCenterView from '@/features/auth/ActivityCenterView';

export const dynamic = 'force-dynamic';

export default function AccountActivityPage() {
  return <ActivityCenterView />;
}
