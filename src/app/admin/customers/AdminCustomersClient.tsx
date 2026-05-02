'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { supabaseBrowser } from '@/lib/supabase/browser';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Search, Globe, Languages, Users, Save, 
  Download, Trash2, Layout, ChevronLeft, 
  ChevronRight, ArrowUpRight, Filter, Database, 
  Sparkles, UserCheck, Mail, Phone, Terminal, 
  Hash, User, ShieldCheck, CheckCircle2, Clock, 
  ShieldAlert, XCircle, X, FileText, RefreshCw, ExternalLink // <-- Añadimos RefreshCw y ExternalLink
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
  const [modal, setModal] = useState<{ isOpen: boolean; customer: Customer | null; docUrl: string | null }>({ isOpen: false, customer: null, docUrl: null });

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
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, [q, country, language, page, limit]);

  useEffect(() => { void load(); }, [load]);

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
          setModal(prev => ({ ...prev, docUrl: data.url }));
        } else {
          setModal(prev => ({ ...prev, docUrl: null }));
        }
      } catch (error) {
        setModal(prev => ({ ...prev, docUrl: null }));
      }
    } else {
      setModal(prev => ({ ...prev, docUrl: null }));
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
      
      setItems(prev => prev.map(c => c.id === modal.customer!.id ? { ...c, identity_status: newStatus } : c));
      setModal({ isOpen: false, customer: null, docUrl: null });
    } catch (error) {
      alert("Hubo un error al procesar la identidad.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'verified': return <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-green-500/20 shadow-inner"><CheckCircle2 className="size-3"/> Verificado</span>;
      case 'pending': return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-brand-yellow px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-amber-500/20 shadow-inner animate-pulse"><Clock className="size-3"/> Pendiente</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1 bg-red-500/10 text-rose-500 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-red-500/20 shadow-inner"><XCircle className="size-3"/> Rechazado</span>;
      default: return <span className="inline-flex items-center gap-1 bg-brand-dark/5 text-muted px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-brand-dark/10 shadow-inner"><ShieldAlert className="size-3"/> No ID</span>;
    }
  };

  const signals = [
    { label: 'Identidades', value: total != null ? String(total) : '0', note: 'Viajeros únicos.' },
    { label: 'KYC Pending', value: String(items.filter(i => i.identity_status === 'pending').length), note: 'Requieren revisión.', icon: Clock },
  ];

  // Identificar si el documento es PDF
  const isPdf = modal.docUrl?.includes('.pdf') || modal.customer?.identity_doc_path?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 🛡️ MODAL KYC FORENSE */}
      {modal.isOpen && modal.customer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface border border-brand-dark/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6 border-b border-brand-dark/5 pb-4">
              <div>
                <h3 className="font-heading text-2xl text-main flex items-center gap-3 uppercase tracking-tight">
                  <ShieldCheck className="size-6 text-brand-blue" /> KYC Forense
                </h3>
                <p className="text-xs font-mono text-muted mt-1 uppercase tracking-widest">{modal.customer.email}</p>
              </div>
              <button onClick={() => setModal({ isOpen: false, customer: null, docUrl: null })} className="p-2 bg-surface-2 rounded-full hover:bg-brand-dark/5 transition-colors">
                <X className="size-5" />
              </button>
            </div>

            <div className="py-4 flex flex-col items-center justify-center bg-brand-dark/5 dark:bg-white/5 rounded-2xl border border-brand-dark/10 min-h-[400px] relative overflow-hidden">
              {modal.docUrl === '' ? (
                // 1. ESTADO DE CARGA
                <div className="text-center opacity-60 flex flex-col items-center">
                  <RefreshCw className="size-12 mb-4 text-brand-blue animate-spin" />
                  <p className="text-sm font-bold uppercase tracking-widest">Desencriptando Bóveda...</p>
                </div>
              ) : modal.docUrl ? (
                // 2. DOCUMENTO CARGADO
                <div className="w-full h-full flex flex-col items-center justify-center">
                 {isPdf ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface rounded-2xl border border-brand-dark/10 w-full max-w-sm mx-auto shadow-inner">
                      <FileText className="size-16 text-brand-blue mb-4 opacity-80" />
                      <p className="text-main font-bold uppercase tracking-widest text-sm">Formato PDF Protegido</p>
                      <p className="text-muted text-xs mt-2 leading-relaxed">
                        Por normativas de seguridad, el navegador no permite previsualizar PDFs incrustados. Utiliza el botón inferior para auditar el documento en una pestaña segura.
                      </p>
                    </div>
                  ) : (
                    <img src={modal.docUrl} alt="ID Document" className="max-h-[50vh] object-contain rounded-lg shadow-lg border border-brand-dark/10" />
                  )}
                  
                  {/* Salvavidas: Botón para abrir en otra pestaña si falla el renderizado */}
                  <a href={modal.docUrl} target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue hover:text-brand-yellow transition-colors bg-surface px-4 py-2 rounded-xl border border-brand-blue/20">
                    <ExternalLink className="size-4" /> Abrir archivo original
                  </a>
                </div>
              ) : (
                // 3. ERROR / SIN DOCUMENTO
                <div className="text-center opacity-40 flex flex-col items-center">
                  <FileText className="size-16 mb-4 text-brand-blue" />
                  <p className="text-sm font-bold uppercase tracking-widest">Documento No Accesible</p>
                  <p className="text-xs mt-2 max-w-sm">Asegúrate de haber creado la ruta API en: /api/admin/customers/[id]/document/route.ts</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Button variant="outline" onClick={() => handleVerify('rejected')} className="h-12 px-8 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold uppercase tracking-widest text-[10px] rounded-xl">
                Rechazar (Fraudulento)
              </Button>
              <Button onClick={() => handleVerify('verified')} className="h-12 px-8 bg-brand-blue text-white hover:bg-brand-blue/90 font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-pop">
                <CheckCircle2 className="size-4 mr-2" /> Certificar Identidad
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 pb-10">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <UserCheck className="h-3.5 w-3.5" /> Customer Intelligence Lane
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tighter">
            Directorio de <span className="text-brand-yellow italic font-light">Clientes</span>
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

      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop overflow-hidden">
        {/* LA TABLA */}
        <div className="overflow-x-auto custom-scrollbar px-2 pb-6 pt-6">
          <table className="w-full text-left text-sm min-w-[1100px]">
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
                <tr key={c.id} className="group transition-colors hover:bg-surface-2/50 bg-surface">
                  <td className="px-8 py-8 align-top">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 border border-brand-blue/5 flex items-center justify-center text-brand-blue font-bold text-sm shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                        {c.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-heading text-xl text-main group-hover:text-brand-blue transition-colors leading-none tracking-tight">
                          {c.name || <span className="opacity-20 italic">Identidad pendiente</span>}
                        </div>
                        <div className="mt-2 font-mono text-[9px] text-muted uppercase tracking-widest opacity-50 flex items-center gap-2">
                           <Hash className="h-3 w-3" /> {c.id.slice(0,8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 align-top">
                    <div className="space-y-2">
                      <div className="font-medium text-main flex items-center gap-3">
                         <Mail className="h-4 w-4 text-brand-blue opacity-30" /> {c.email || <span className="opacity-20">—</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 align-top text-center">
                    {getStatusBadge(c.identity_status || 'none')}
                  </td>
                  <td className="px-8 py-8 align-top">
                     <div className="text-[11px] font-bold text-main">{new Date(c.created_at).toLocaleDateString('es-CO')}</div>
                  </td>
                  <td className="px-8 py-8 align-top text-right flex flex-col gap-2 items-end">
                    <Button onClick={() => openModal(c)} disabled={c.identity_status === 'none'} variant="outline" className="h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest border-brand-blue/20 text-brand-blue hover:bg-brand-blue/10 transition-all">
                      <ShieldCheck className="h-4 w-4 mr-2" /> Validar ID
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