import { AdminCatalogClient } from './AdminCatalogClient';

export const dynamic = 'force-dynamic';

export default function AdminCatalogPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold">Catálogo premium</h1>
      <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
        Reglas de precio, disponibilidad y colecciones curadas. (P77)
      </p>
      <div className="mt-4">
        <AdminCatalogClient />
      </div>
    </div>
  );
}
