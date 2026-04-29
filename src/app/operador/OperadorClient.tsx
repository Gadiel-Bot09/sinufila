'use client';

import { useTicketsRealtime } from '@/hooks/useTicketsRealtime';
import { processOperatorAction, transferTicket } from './actions';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; type: ToastType; message: string }

let _toastId = 0;

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border animate-in slide-in-from-right-4 transition-all ${
            t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            t.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' :
                                   'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span className="text-base shrink-0">
            {t.type === 'success' ? '✅' : t.type === 'error' ? '⚠️' : '🔔'}
          </span>
          <p className="flex-1 leading-snug">{t.message}</p>
          <button onClick={() => onRemove(t.id)} className="text-gray-400 hover:text-gray-600 shrink-0">✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────
interface Window { id: string; name: string; number: string }

function TransferModal({
  ticketCode,
  ticketId,
  windows,
  currentWindowId,
  onClose,
  onTransferred,
}: {
  ticketCode: string;
  ticketId: string;
  windows: Window[];
  currentWindowId?: string;
  onClose: () => void;
  onTransferred: () => void;
}) {
  const [selectedWindow, setSelectedWindow] = useState('');
  const [loading, setLoading] = useState(false);

  const available = windows.filter(w => w.id !== currentWindowId);

  const handleTransfer = async () => {
    if (!selectedWindow) return;
    setLoading(true);
    const result = await transferTicket(ticketId, selectedWindow);
    setLoading(false);
    if (result.error) {
      alert(result.error);
    } else {
      onTransferred();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">↗ Transferir Turno</h2>
          <p className="text-sm text-gray-500 mt-1">
            Turno <strong className="font-mono text-[#0A2463]">{ticketCode}</strong> → selecciona la ventanilla destino
          </p>
        </div>

        <div className="p-6 space-y-3">
          {available.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No hay otras ventanillas disponibles.</p>
          ) : (
            available.map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedWindow(w.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedWindow === w.id
                    ? 'border-[#0A2463] bg-[#0A2463]/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">🏢</span>
                <div>
                  <p className="font-bold text-gray-800">Ventanilla {w.number}</p>
                  <p className="text-sm text-gray-500">{w.name}</p>
                </div>
                {selectedWindow === w.id && <span className="ml-auto text-[#0A2463]">✓</span>}
              </button>
            ))
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleTransfer}
            disabled={!selectedWindow || loading}
            className="flex-1 py-2.5 rounded-xl bg-[#0A2463] text-white font-semibold hover:bg-[#081b4b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Transfiriendo...' : '↗ Transferir'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OperadorClient({
  entityId,
  operator,
  allWindows,
}: {
  entityId: string;
  operator: any;
  allWindows: Window[];
}) {
  const { tickets, loading } = useTicketsRealtime(entityId);
  const [submitting, setSubmitting] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Notificación cuando llega un nuevo ticket en espera ────────────────────
  const waitingCount = tickets.filter(t => t.status === 'waiting').length;
  useEffect(() => {
    if (prevCountRef.current !== null && waitingCount > prevCountRef.current) {
      addToast('info', `🔔 Nuevo turno en cola (${waitingCount} en espera)`);
    }
    prevCountRef.current = waitingCount;
  }, [waitingCount, addToast]);

  // Servicios únicos en la cola
  const servicesInQueue = useMemo(() => {
    const waiting = tickets.filter(t => t.status === 'waiting');
    const seen = new Map<string, { id: string; name: string; color: string; count: number }>();
    for (const t of waiting) {
      const id = t.service?.name ?? 'Sin servicio';
      if (!seen.has(id)) seen.set(id, { id, name: t.service?.name, color: t.service?.color, count: 0 });
      seen.get(id)!.count++;
    }
    return Array.from(seen.values());
  }, [tickets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0A2463]/20 border-t-[#0A2463] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Conectando en tiempo real...</p>
        </div>
      </div>
    );
  }

  const allWaiting = tickets.filter(t => t.status === 'waiting');
  const waitingTickets = allWaiting
    .filter(t => !serviceFilter || t.service?.name === serviceFilter)
    .sort((a, b) => {
      if (a.priority.level !== b.priority.level) return a.priority.level - b.priority.level;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const currentTicket = tickets.find(t => t.status === 'attending' && t.operator_id === operator.id);
  const myCompleted = tickets.filter(t => t.operator_id === operator.id && t.status === 'completed');
  const mySkipped   = tickets.filter(t => t.operator_id === operator.id && (t.status === 'skipped' || t.status === 'absent'));
  const avgAttendTime = myCompleted.length > 0
    ? Math.round(myCompleted.reduce((acc, t) => acc + (t.attend_time_seconds || 0), 0) / myCompleted.length / 60)
    : 0;

  const handleAction = async (action: string, ticketId?: string) => {
    if (submitting) return;
    setSubmitting(true);

    const targetId = ticketId || waitingTickets[0]?.id;
    if (action === 'attend' && !targetId) {
      addToast('info', 'No hay turnos en espera.');
      setSubmitting(false);
      return;
    }

    const result = await processOperatorAction(action as any, targetId);
    if (result?.error) {
      addToast('error', result.error);
    } else {
      const msgs: Record<string, string> = {
        attend:   '✅ Turno llamado exitosamente',
        complete: '✅ Turno marcado como atendido',
        skip:     '⏩ Turno saltado',
        absent:   '❌ Turno marcado como ausente',
        recall:   '🔁 Turno rellamado',
      };
      addToast('success', msgs[action] || '✅ Acción completada');
    }
    setSubmitting(false);
  };

  const handleTransferred = () => {
    addToast('success', '↗ Turno transferido exitosamente');
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {showTransfer && currentTicket && (
        <TransferModal
          ticketCode={currentTicket.ticket_code}
          ticketId={currentTicket.id}
          windows={allWindows}
          currentWindowId={operator.window_id}
          onClose={() => setShowTransfer(false)}
          onTransferred={handleTransferred}
        />
      )}

      <div className="flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <div className="bg-[#0A2463] text-white px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">Panel Operador</span>
            {operator.window && (
              <span className="bg-yellow-400 text-[#0A2463] px-3 py-0.5 rounded-full font-black text-sm">
                🏢 Ventanilla {operator.window.number}
                {operator.window.name ? ` — ${operator.window.name}` : ''}
              </span>
            )}
            {/* Badge Realtime */}
            <span className="flex items-center gap-1.5 bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              En vivo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-200 text-sm">{operator.name}</span>
            {/* Filtro de servicio */}
            {servicesInQueue.length > 1 && (
              <div className="flex gap-1.5 items-center">
                <span className="text-blue-300 text-xs">Filtrar:</span>
                <button
                  onClick={() => setServiceFilter(null)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                    serviceFilter === null ? 'bg-white text-[#0A2463]' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Todos ({allWaiting.length})
                </button>
                {servicesInQueue.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setServiceFilter(s.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                      serviceFilter === s.name ? 'text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    style={serviceFilter === s.name ? { backgroundColor: s.color } : {}}
                  >
                    {s.name} ({s.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 flex-1 overflow-hidden">

          {/* ── Columna Izquierda — Cola de Espera ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="bg-[#0A2463] text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">En Espera ({waitingTickets.length})</h2>
              {allWaiting.length > waitingTickets.length && (
                <span className="text-blue-300 text-xs">Filtro activo</span>
              )}
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-gray-50">
              {waitingTickets.map((t, idx) => (
                <div key={t.id} className={`bg-white border rounded-xl p-3 shadow-sm flex items-center justify-between transition-all ${idx === 0 ? 'border-[#0A2463]/30 ring-1 ring-[#0A2463]/10' : 'border-gray-100'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {idx === 0 && <span className="text-xs bg-[#0A2463] text-white px-1.5 py-0.5 rounded font-bold">PRÓXIMO</span>}
                      <h3 className="font-bold text-lg font-mono">{t.ticket_code}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-md font-mono border flex items-center gap-1" style={{ borderColor: t.priority.color, color: t.priority.color }}>
                        {t.priority.icon} Nvl.{t.priority.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{t.service.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(t.created_at).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {idx === 0 && !currentTicket && (
                    <button
                      onClick={() => handleAction('attend', t.id)}
                      disabled={submitting}
                      className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      Llamar
                    </button>
                  )}
                </div>
              ))}
              {waitingTickets.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-8">
                  <span className="text-4xl mb-3">🎉</span>
                  <p className="font-medium">Cola vacía</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Columna Central — Turno en Atención ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col p-6 items-center text-center">
            <h2 className="text-xl font-bold text-gray-700 mb-6 w-full text-left">Turno Actual</h2>

            {currentTicket ? (
              <div className="flex flex-col items-center flex-1 w-full justify-center mt-[-20px]">
                <div className="text-8xl font-mono font-bold text-[#0A2463] mb-3 leading-none">
                  {currentTicket.ticket_code}
                </div>
                <div className="text-2xl text-gray-600 font-medium mb-2 border-b-2 inline-block px-4 pb-2" style={{ borderColor: currentTicket.service.color }}>
                  {currentTicket.service.name}
                </div>
                <div className="text-lg text-gray-500 flex items-center gap-2 mb-6 mt-2">
                  {currentTicket.priority.icon} {currentTicket.priority.name}
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  <button
                    onClick={() => handleAction('complete', currentTicket.id)}
                    disabled={submitting}
                    className="col-span-2 bg-[#4CAF82] hover:bg-[#3d8c68] text-white py-4 rounded-xl text-xl font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    ✅ Turno Atendido
                  </button>
                  <button
                    onClick={() => handleAction('recall', currentTicket.id)}
                    disabled={submitting}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl font-semibold transition-colors"
                  >
                    🔁 Rellamar
                  </button>
                  <button
                    onClick={() => setShowTransfer(true)}
                    disabled={submitting}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 rounded-xl font-semibold transition-colors"
                  >
                    ↗ Transferir
                  </button>
                  <button
                    onClick={() => handleAction('skip', currentTicket.id)}
                    disabled={submitting}
                    className="bg-orange-100 hover:bg-orange-200 text-orange-700 py-3 rounded-xl font-semibold transition-colors"
                  >
                    ⏩ Saltar
                  </button>
                  <button
                    onClick={() => handleAction('absent', currentTicket.id)}
                    disabled={submitting}
                    className="bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-xl font-semibold transition-colors"
                  >
                    ❌ Ausente
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center flex-1 w-full justify-center text-gray-400 mt-[-20px]">
                <div className="text-8xl mb-4">☕</div>
                <p className="text-xl font-medium">Ventanilla Disponible</p>
                <button
                  onClick={() => handleAction('attend', waitingTickets[0]?.id)}
                  disabled={submitting || waitingTickets.length === 0}
                  className="mt-8 bg-[#0A2463] hover:bg-[#081b4b] text-white py-4 px-8 rounded-xl text-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  ⏭ Llamar Siguiente
                </button>
                {waitingTickets.length === 0 && (
                  <p className="text-sm text-gray-400 mt-3">No hay turnos en espera</p>
                )}
              </div>
            )}
          </div>

          {/* ── Columna Derecha — Estadísticas del Día ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col p-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-700 mb-5">Mis Estadísticas (Hoy)</h2>

            <div className="grid grid-cols-1 gap-3 mb-5">
              <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Atendidos</p>
                  <p className="text-3xl font-black text-green-700 mt-0.5">{myCompleted.length}</p>
                </div>
                <span className="text-3xl">✅</span>
              </div>
              <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">Tiempo Promedio</p>
                  <p className="text-3xl font-black text-teal-700 mt-0.5">{avgAttendTime} <span className="text-base font-normal">min</span></p>
                </div>
                <span className="text-3xl">⏱</span>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Saltados / Ausentes</p>
                  <p className="text-3xl font-black text-red-700 mt-0.5">{mySkipped.length}</p>
                </div>
                <span className="text-3xl">⏩</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cola General</h3>
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600 font-medium text-sm">Total en espera</span>
                  <span className="font-black text-2xl text-[#0A2463]">{allWaiting.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map(level => {
                    const count = allWaiting.filter(t => t.priority.level === level).length;
                    if (count === 0) return null;
                    return (
                      <span key={level} className="text-xs border px-2.5 py-1 rounded-lg bg-white font-semibold text-gray-600">
                        Nivel {level}: <strong>{count}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
