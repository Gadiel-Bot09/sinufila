'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

interface Ticket {
  id: string;
  ticket_code: string;
  status: string;
  created_at: string;
  attended_at: string | null;
  completed_at: string | null;
  attend_time_seconds: number | null;
  entity_id: string;
  service: { name: string; color: string } | null;
  priority: { name: string; icon: string; color: string } | null;
  window: { name: string; number: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  waiting:   { label: 'En Espera',   icon: '⏳', color: '#FF6B35', bg: '#fff7ed' },
  attending: { label: 'En Atención', icon: '🧑‍💼', color: '#00838F', bg: '#f0fdfa' },
  completed: { label: 'Atendido',    icon: '✅', color: '#4CAF82', bg: '#f0fdf4' },
  absent:    { label: 'Ausente',     icon: '❌', color: '#dc2626', bg: '#fef2f2' },
  skipped:   { label: 'Saltado',     icon: '⏩', color: '#9ca3af', bg: '#f9fafb' },
};

function formatTimeCO(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' });
}

// ─── Satisfaction Widget ──────────────────────────────────────────────────────
function SatisfactionWidget({ ticketId, entityId }: { ticketId: string; entityId: string }) {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [comment, setComment]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await fetch('/api/satisfaccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, entityId, rating, comment }),
      });
      setSubmitted(true);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">🙏</div>
        <p className="text-green-700 font-bold text-sm">¡Gracias por tu calificación!</p>
        <p className="text-green-600 text-xs mt-1">Tu opinión nos ayuda a mejorar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <p className="text-sm font-bold text-gray-700 text-center mb-3">¿Cómo fue tu atención?</p>

      {/* Stars */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="text-3xl transition-transform hover:scale-110 active:scale-95"
          >
            {star <= (hovered || rating) ? '⭐' : '☆'}
          </button>
        ))}
      </div>

      {/* Comment */}
      {rating > 0 && (
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, 200))}
          placeholder="Comentario opcional... (máx 200 caracteres)"
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#00838F]/30 bg-gray-50"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || loading}
        className="w-full py-2.5 rounded-xl bg-[#0A2463] text-white text-sm font-bold transition-all hover:bg-[#081b4b] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : 'Enviar Calificación'}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TurnoStatusClient() {
  const searchParams = useSearchParams();
  const entityId  = searchParams.get('entity');
  const ticketId  = searchParams.get('id');

  const [ticket, setTicket]   = useState<Ticket | null>(null);
  const [position, setPosition] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }));
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!entityId || !ticketId) { setNotFound(true); setLoading(false); return; }

    const supabase = createClient();

    const fetchTicket = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, service:services(name, color), priority:priority_levels(name, icon, color), window:windows(name, number)')
        .eq('id', ticketId)
        .eq('entity_id', entityId)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setTicket(data as Ticket);

      if (data.status === 'waiting') {
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('entity_id', entityId)
          .eq('status', 'waiting')
          .lt('created_at', data.created_at);
        setPosition(count ?? 0);
      }
      setLoading(false);
    };

    fetchTicket();

    const channel = supabase
      .channel(`turno-status-${ticketId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` }, () => fetchTicket())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [entityId, ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A2463] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-200">Cargando estado del turno...</p>
        </div>
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Turno no encontrado</h1>
          <p className="text-gray-500">El turno no existe o fue archivado. Verifica el código QR.</p>
        </div>
      </div>
    );
  }

  const status   = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG['waiting'];
  const isActive = ticket.status === 'waiting' || ticket.status === 'attending';
  const isDone   = ticket.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2463] via-[#163580] to-[#00838F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-black">S</div>
            <span className="text-white font-black text-xl">SinuFila</span>
          </div>
          <p className="text-blue-200 text-sm">Seguimiento de Turno • {currentTime}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Estado banner */}
          <div className="px-6 py-4 flex items-center justify-center gap-3 text-lg font-bold"
            style={{ backgroundColor: status.bg, color: status.color }}>
            <span className="text-2xl">{status.icon}</span>
            <span>{status.label}</span>
          </div>

          {/* Ticket code */}
          <div className="text-center px-6 py-8 border-b border-dashed border-gray-200">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Tu Turno</p>
            <h1 className="text-7xl font-mono font-black text-[#0A2463] tracking-tight leading-none">
              {ticket.ticket_code}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              {ticket.service && (
                <span className="px-3 py-1 rounded-full text-white text-sm font-semibold" style={{ backgroundColor: ticket.service.color }}>
                  {ticket.service.name}
                </span>
              )}
              {ticket.priority && <span className="text-base">{ticket.priority.icon}</span>}
            </div>
          </div>

          {/* Info */}
          <div className="px-6 py-5 space-y-3">

            {ticket.status === 'waiting' && (
              <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div>
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Posición en Cola</p>
                  <p className="text-orange-700 text-sm mt-0.5">Turnos antes que tú</p>
                </div>
                <div className="text-4xl font-black text-orange-500">{position}</div>
              </div>
            )}

            {ticket.status === 'attending' && ticket.window && (
              <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl p-4">
                <div>
                  <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Dirígete a</p>
                  <p className="text-teal-800 font-bold text-lg">Ventanilla {ticket.window.number}</p>
                  <p className="text-teal-600 text-sm">{ticket.window.name}</p>
                </div>
                <div className="text-4xl">🏢</div>
              </div>
            )}

            {ticket.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-bold">¡Tu turno ha sido atendido!</p>
                {ticket.attend_time_seconds && (
                  <p className="text-green-600 text-sm mt-1">Tiempo de atención: {Math.round(ticket.attend_time_seconds / 60)} min</p>
                )}
              </div>
            )}

            {(ticket.status === 'absent' || ticket.status === 'skipped') && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-700 font-bold">Este turno ya no está activo.</p>
                <p className="text-red-500 text-sm mt-1">Solicita un nuevo turno en el dispensador si lo necesitas.</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Emitido</span>
                <span className="text-gray-700 font-medium">{formatTimeCO(ticket.created_at)}</span>
              </div>
              {ticket.attended_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Inició atención</span>
                  <span className="text-gray-700 font-medium">{formatTimeCO(ticket.attended_at)}</span>
                </div>
              )}
              {ticket.completed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Finalizado</span>
                  <span className="text-gray-700 font-medium">{formatTimeCO(ticket.completed_at)}</span>
                </div>
              )}
            </div>

            {/* ── Encuesta de satisfacción ── */}
            {isDone && entityId && ticketId && (
              <div className="pt-2">
                <SatisfactionWidget ticketId={ticketId} entityId={entityId} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 text-center">
            {isActive
              ? <p className="text-xs text-gray-400 animate-pulse">● Actualizando en tiempo real</p>
              : <p className="text-xs text-gray-400">Este turno ya finalizó</p>
            }
          </div>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">SinuFila • sinufila.sinuhub.com</p>
      </div>
    </div>
  );
}
