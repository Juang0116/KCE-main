// src/app/admin/agents/page.tsx
import 'server-only';
import AdminAgentsClient from './AdminAgentsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Agentes IA | Admin KCE' };

export default function AdminAgentsPage() {
  return <AdminAgentsClient />;
}
