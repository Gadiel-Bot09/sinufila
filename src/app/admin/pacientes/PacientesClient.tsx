'use client';

import { useState, useTransition, useCallback } from 'react';
import { upsertPatient, deletePatient } from './actions';

interface Patient {
  id: string;
  full_name: string;
  document_number: string;
  phone_number: string | null;
  created_at: string;
}

interface PacientesClientProps {
  initialPatients: Patient[];
  initialTotal: number;
}

export default function PacientesClient({ initialPatients, initialTotal }: PacientesClientProps) {
  const [patients, setPatients]   = useState<Patient[]>(initialPatients);
  const [total, setTotal]         = useState(initialTotal);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [isPending, startTransition] = useTransition();

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Carga filtrada (client-side sobre la lista actual) ──────────────────────
  // Para búsqueda inmediata sin round-trip, filtramos localmente y re-cargamos en blur
  const filtered = patients.filter(p =>
    !search ||
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.document_number.includes(search)
  );

  // ── Abrir modal ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditPatient(null);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const openEdit = (p: Patient) => {
    setEditPatient(p);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  // ── Guardar (create / update) ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await upsertPatient(fd);
      if (res.error) {
        setFormError(res.error);
      } else {
        setFormSuccess(editPatient ? 'Paciente actualizado.' : 'Paciente registrado.');
        setTimeout(() => {
          setShowModal(false);
          window.location.reload(); // refresca la lista server-side
        }, 800);
      }
    });
  };

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    startTransition(async () => {
      await deletePatient(deleteId);
      setDeleteId(null);
      window.location.reload();
    });
  };

  return (
    <div className="space-y-6">

      {/* ── Barra superior ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0A2463]">👥 Pacientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Directorio de pacientes identificados por número de documento.
            <span className="ml-2 inline-flex items-center bg-[#0A2463]/10 text-[#0A2463] text-xs font-semibold px-2 py-0.5 rounded-full">
              {total} registrados
            </span>
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#0A2463] hover:bg-[#081b4b] text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
        >
          + Nuevo Paciente
        </button>
      </div>

      {/* ── Buscador ── */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre o número de documento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2463]/30 text-sm"
        />
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFB] border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nº Documento</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrado</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <div className="text-4xl mb-2">👥</div>
                    {search ? 'No se encontraron pacientes con ese criterio.' : 'Aún no hay pacientes registrados.'}
                    {!search && (
                      <div className="mt-4">
                        <button onClick={openCreate} className="text-[#0A2463] font-semibold underline underline-offset-2">
                          Registrar el primero →
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{p.full_name}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-lg text-sm">
                        {p.document_number}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {p.phone_number
                        ? <span className="flex items-center gap-1">📱 {p.phone_number}</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {new Date(p.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs font-semibold text-[#0A2463] hover:underline"
                        >
                          Editar
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="text-xs font-semibold text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-[#F8FAFB]">
            <span className="text-xs text-gray-500">
              Mostrando {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          MODAL — Crear / Editar
      ══════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >×</button>

            <h2 className="text-xl font-black text-[#0A2463] mb-1">
              {editPatient ? '✏️ Editar Paciente' : '➕ Nuevo Paciente'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {editPatient ? 'Actualiza los datos del paciente.' : 'Registra un nuevo paciente en el directorio.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {editPatient && <input type="hidden" name="id" value={editPatient.id} />}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  defaultValue={editPatient?.full_name ?? ''}
                  placeholder="Ej: Juan Carlos García López"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2463]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Número de Documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="document_number"
                  required
                  inputMode="numeric"
                  defaultValue={editPatient?.document_number ?? ''}
                  placeholder="Ej: 1234567890"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0A2463]/30"
                />
                <p className="text-xs text-gray-400 mt-1">Solo números, sin puntos ni espacios.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Teléfono WhatsApp <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0A2463]/30">
                  <span className="px-3 py-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 font-semibold shrink-0">🇨🇴 +57</span>
                  <input
                    type="tel"
                    name="phone_number"
                    inputMode="numeric"
                    defaultValue={editPatient?.phone_number
                      ? editPatient.phone_number.replace(/\D/g, '').slice(-10)
                      : ''}
                    placeholder="3001234567"
                    maxLength={10}
                    className="flex-1 px-4 py-3 text-sm font-mono bg-transparent focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Se usará para prellenar WhatsApp en el dispensador.</p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
                  ✅ {formSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-[#0A2463] hover:bg-[#081b4b] text-white font-bold text-sm transition-all disabled:opacity-50"
                >
                  {isPending ? 'Guardando...' : editPatient ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL — Confirmar eliminación
      ══════════════════════════════════════════════════ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h2 className="text-xl font-black text-gray-800 mb-2">¿Eliminar paciente?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Esta acción no se puede deshacer. El paciente será eliminado del directorio.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50"
              >
                {isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
