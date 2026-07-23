'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { supabaseBrowser } from '@/lib/supabase/browser';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Search,
  Globe,
  Languages,
  Users,
  Save,
  Download,
  Trash2,
  Layout,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Filter,
  Database,
  Sparkles,
  UserCheck,
  Mail,
  Phone,
  Terminal,
  Hash,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ShieldAlert,
  XCircle,
  X,
  FileText,
  RefreshCw,
  ExternalLink, // <-- Añadimos RefreshCw y ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Customer = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  country: string | null;
  language: string | null;
  identity_status: 'none' | 'pending' | 'verified' | 'rejected';
  identity_doc_path: string | null;
  created_at: string;
};

// ... (Filtros y Segmentos se mantienen igual)
const LS_KEY = 'kce_admin_customer_filters_v1';

export function AdminCustomersClient() {
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const [saved, setSaved] = useState<any[]>([]);
  const [selectedSaved, setSelectedSaved] = useState('');
  const [saveName, setSaveName] = useState('');
  const [segments, setSegments] = useState<any[]>([]);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [segmentName, setSegmentName] = useState('');

  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // 🛡️ ESTADO DEL MODAL KYC
  const [modal, setModal] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    docUrl: string | null;
  }>({ isOpen: false, customer: null, docUrl: null });

  const pages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [total, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set('q', q.trim());
      if (country.trim()) qs.set('country', country.trim());
      if (language.trim()) qs.set('language', language.trim());
      qs.set('page', String(page));
      qs.set('limit', String(limit));

      const resp = await adminFetch(`/api/admin/customers?${qs.toString()}`);
      const json = await resp.json();
      setItems(json?.items || []);
      setTotal(json?.total ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, country, language, page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  // 🛡️ FUNCIONES KYC
  const openModal = async (customer: Customer) => {
    // 1. Mostrar Spinner de carga
    setModal({ isOpen: true, customer, docUrl: '' });

    if (customer.identity_doc_path) {
      try {
        // 2. Traer URL firmada desde el Backend (Llave Maestra)
        const res = await adminFetch(`/api/admin/customers/${customer.id}/document`);
        if (res.ok) {
          const data = await res.json();
          setModal((prev) => ({ ...prev, docUrl: data.url }));
        } else {
          setModal((prev) => ({ ...prev, docUrl: null }));
        }
      } catch (error) {
        setModal((prev) => ({ ...prev, docUrl: null }));
      }
    } else {
      setModal((prev) => ({ ...prev, docUrl: null }));
    }
  };

  const handleVerify = async (newStatus: 'verified' | 'rejected') => {
    if (!modal.customer) return;
    try {
      const res = await adminFetch(`/api/admin/customers/${modal.customer.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar');

      setItems((prev) =>
        prev.map((c) => (c.id === modal.customer!.id ? { ...c, identity_status: newStatus } : c)),
      );
      setModal({ isOpen: false, customer: null, docUrl: null });
    } catch (error) {
      alert('Hubo un error al procesar la identidad.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-green-500 shadow-inner">
            <CheckCircle2 className="size-3" /> Verificado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex animate-pulse items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-yellow shadow-inner">
            <Clock className="size-3" /> Pendiente
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-rose-500 shadow-inner">
            <XCircle className="size-3" /> Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-brand-dark/10 bg-brand-dark/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-muted shadow-inner">
            <ShieldAlert className="size-3" /> No ID
          </span>
        );
    }
  };

  const signals = [
    { label: 'Identidades', value: total != null ? String(total) : '0', note: 'Viajeros únicos.' },
    {
      label: 'KYC Pending',
      value: String(items.filter((i) => i.identity_status === 'pending').length),
      note: 'Requieren revisión.',
      icon: Clock,
    },
  ];

  // Identificar si el documento es PDF
  const isPdf =
    modal.docUrl?.includes('.pdf') ||
    modal.customer?.identity_doc_path?.toLowerCase().endsWith('.pdf');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 🛡️ MODAL KYC FORENSE */}
      {modal.isOpen && modal.customer && (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="flex w-full max-w-3xl flex-col rounded-3xl border border-brand-dark/10 bg-surface p-6 shadow-2xl dark:border-white/10">
            <div className="mb-6 flex items-center justify-between border-b border-brand-dark/5 pb-4">
              <div>
                <h3 className="flex items-center gap-3 font-heading text-2xl uppercase tracking-tight text-main">
                  <ShieldCheck className="size-6 text-brand-blue" /> KYC Forense
                </h3>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                  {modal.customer.email}
                </p>
              </div>
              <button
                onClick={() => setModal({ isOpen: false, customer: null, docUrl: null })}
                className="rounded-full bg-surface-2 p-2 transition-colors hover:bg-brand-dark/5"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-brand-dark/10 bg-brand-dark/5 py-4 dark:bg-white/5">
              {modal.docUrl === '' ? (
                // 1. ESTADO DE CARGA
                <div className="flex flex-col items-center text-center opacity-60">
                  <RefreshCw className="mb-4 size-12 animate-spin text-brand-blue" />
                  <p className="text-sm font-bold uppercase tracking-widest">
                    Desencriptando Bóveda...
                  </p>
                </div>
              ) : modal.docUrl ? (
                // 2. DOCUMENTO CARGADO
                <div className="flex h-full w-full flex-col items-center justify-center">
                  {isPdf ? (
                    <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-brand-dark/10 bg-surface p-8 text-center shadow-inner">
                      <FileText className="mb-4 size-16 text-brand-blue opacity-80" />
                      <p className="text-sm font-bold uppercase tracking-widest text-main">
                        Formato PDF Protegido
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        Por normativas de seguridad, el navegador no permite previsualizar PDFs
                        incrustados. Utiliza el botón inferior para auditar el documento en una
                        pestaña segura.
                      </p>
                    </div>
                  ) : (
                    <img
                      src={modal.docUrl}
                      alt="ID Document"
                      className="max-h-[50vh] rounded-lg border border-brand-dark/10 object-contain shadow-lg"
                    />
                  )}

                  {/* Salvavidas: Botón para abrir en otra pestaña si falla el renderizado */}
                  <a
                    href={modal.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center gap-2 rounded-xl border border-brand-blue/20 bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-blue transition-colors hover:text-brand-yellow"
                  >
                    <ExternalLink className="size-4" /> Abrir archivo original
                  </a>
                </div>
              ) : (
                // 3. ERROR / SIN DOCUMENTO
                <div className="flex flex-col items-center text-center opacity-40">
                  <FileText className="mb-4 size-16 text-brand-blue" />
                  <p className="text-sm font-bold uppercase tracking-widest">
                    Documento No Accesible
                  </p>
                  <p className="mt-2 max-w-sm text-xs">
                    Asegúrate de haber creado la ruta API en:
                    /api/admin/customers/[id]/document/route.ts
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => handleVerify('rejected')}
                className="h-12 rounded-xl border-rose-200 px-8 text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50"
              >
                Rechazar (Fraudulento)
              </Button>
              <Button
                onClick={() => handleVerify('verified')}
                className="h-12 rounded-xl bg-brand-blue px-8 text-[10px] font-bold uppercase tracking-widest text-white shadow-pop hover:bg-brand-blue/90"
              >
                <CheckCircle2 className="mr-2 size-4" /> Certificar Identidad
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER INSTITUCIONAL */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <UserCheck className="h-3.5 w-3.5" /> Customer Intelligence Lane
          </div>
          <h1 className="font-heading text-4xl tracking-tighter text-main md:text-5xl">
            Directorio de <span className="font-light italic text-brand-yellow">Clientes</span>
          </h1>
        </div>
      </header>

      {/* BENCH */}
      <AdminOperatorWorkbench
        eyebrow="Relational Strategy"
        title="Auditoría de Audiencias & KYC"
        description="Visualización 360 del viajero. Aprueba los documentos de identidad pendientes para garantizar un entorno seguro y mitigar el fraude."
        actions={[{ href: '/admin/bookings', label: 'Ver Reservas', tone: 'primary' }]}
        signals={signals}
      />

      <section className="overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop">
        {/* LA TABLA */}
        <div className="custom-scrollbar overflow-x-auto px-2 pb-6 pt-6">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Entidad Viajera</th>
                <th className="px-8 py-5">Canales de Contacto</th>
                <th className="px-8 py-5 text-center">Estado KYC</th>
                <th className="px-8 py-5">Fecha Alta</th>
                <th className="px-8 py-5 text-right">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5">
              {items.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-surface-2/50 group bg-surface transition-colors"
                >
                  <td className="px-8 py-8 align-top">
                    <div className="flex items-center gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-sm font-bold text-brand-blue shadow-inner transition-transform group-hover:scale-105">
                        {c.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-heading text-xl leading-none tracking-tight text-main transition-colors group-hover:text-brand-blue">
                          {c.name || <span className="italic opacity-20">Identidad pendiente</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-muted opacity-50">
                          <Hash className="h-3 w-3" /> {c.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 align-top">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 font-medium text-main">
                        <Mail className="h-4 w-4 text-brand-blue opacity-30" />{' '}
                        {c.email || <span className="opacity-20">—</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center align-top">
                    {getStatusBadge(c.identity_status || 'none')}
                  </td>
                  <td className="px-8 py-8 align-top">
                    <div className="text-[11px] font-bold text-main">
                      {new Date(c.created_at).toLocaleDateString('es-CO')}
                    </div>
                  </td>
                  <td className="flex flex-col items-end gap-2 px-8 py-8 text-right align-top">
                    <Button
                      onClick={() => openModal(c)}
                      disabled={c.identity_status === 'none'}
                      variant="outline"
                      className="h-9 rounded-lg border-brand-blue/20 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-blue transition-all hover:bg-brand-blue/10"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" /> Validar ID
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
