import AdminRbacClient from './AdminRbacClient';

export default function AdminRbacPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">RBAC</h1>
      <p className="text-sm opacity-80">
        Administra roles, bindings y break-glass. Estos cambios quedan auditados en Ops/Audit Log.
      </p>
      <AdminRbacClient />
    </div>
  );
}
