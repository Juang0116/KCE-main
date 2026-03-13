// src/app/admin/ops/notifications/page.tsx
import 'server-only';

import { AdminOpsNotificationsClient } from './AdminOpsNotificationsClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <AdminOpsNotificationsClient />;
}
