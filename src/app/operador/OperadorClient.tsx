'use client';

import { useTicketsRealtime } from '@/hooks/useTicketsRealtime';
import { processOperatorAction } from './actions';
import { useState, useMemo } from 'react';

export default function OperadorClient({ entityId, operator }: { entityId: string, operator: any }) {
  const { tickets, loading } = useTicketsRealtime(entityId);
  const [submitting, setSubmitting] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);

  // Servicios únicos en la cola — DEBE estar antes del early return (reglas de hooks)
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

  if (loading) return <div className="p-8">Cargando datos en tiempo real...</div>;

  // Todos los tickets en espera (para estadísticas globales)
  const allWaiting = tickets.filter(t => t.status === 'waiting');

  // Cola filtrada (por servicio seleccionado o todos)
  const waitingTickets = allWaiting
    .filter(t => !serviceFilter || t.service?.name === serviceFilter)
    .sort((a, b) => {
      if (a.priority.level !== b.priority.level) return a.priority.level - b.priority.level;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  // 2. Current Ticket (attending by ME)
  const currentTicket = tickets.find(t => t.status === 'attending' && t.operator_id === operator.id);

  // 3. Stats for today (completed/skipped/absent) by ME? Or overall?
  // Requirements: Total de turnos atendidos, tiempo promedio, cantidad en espera.
  const myCompleted = tickets.filter(t => t.operator_id === operator.id && t.status === 'completed');
  const avgAttendTime = myCompleted.length > 0
    ? Math.round(myCompleted.reduce((acc, t) => acc + (t.attend_time_seconds || 0), 0) / myCompleted.length / 60)
    : 0;

  const handleAction = async (action: any, ticketId?: string) => {
    if (submitting) return;
    setSubmitting(true);
    
    // For "attend", we actually update a specific ticket to attending.
    // If no ticketId provided, pick the top of the queue.
    const targetId = ticketId || waitingTickets[0]?.id;
    if (action === 'attend' && !targetId) {
      alert("No hay turnos en espera.");
      setSubmitting(false);
      return;
    }

    const { error } = await processOperatorAction(action, targetId);
    if (error) {
      alert(error);
    }
    setSubmitting(false);
  };

  return (
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
      
      {/* Columna Izquierda — Cola de Espera */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="bg-[#0A2463] text-white p-4">
          <h2 className="text-xl font-bold">En Espera ({waitingTickets.length})</h2>
        </div>
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-gray-50">
          {waitingTickets.map((t, idx) => (
            <div key={t.id} className="bg-white border rounded-lg p-3 shadow-sm flex items-center justify-between">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-bold text-lg">{t.ticket_code}</h3>
                   <span className="text-xs px-2 py-0.5 rounded-md font-mono border flex items-center gap-1" style={{borderColor: t.priority.color, color: t.priority.color}}>
                     {t.priority.icon} Nvl.{t.priority.level}
                   </span>
                 </div>
                 <p className="text-sm text-gray-500">{t.service.name}</p>
                 <p className="text-xs text-gray-400 mt-1">Llegada: {new Date(t.created_at).toLocaleTimeString()}</p>
               </div>
               {idx === 0 && !currentTicket && (
                 <button 
                   onClick={() => handleAction('attend', t.id)}
                   disabled={submitting}
                   className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-2 rounded-md font-semibold text-sm transition-colors"
                 >
                   Llamar
                 </button>
               )}
            </div>
          ))}
          {waitingTickets.length === 0 && (
            <p className="text-center text-gray-500 mt-8">No hay turnos en espera</p>
          )}
        </div>
      </div>

      {/* Columna Central — Turno en Atención */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col p-6 items-center text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-6 w-full text-left">Turno Actual</h2>
        
        {currentTicket ? (
          <div className="flex flex-col items-center flex-1 w-full justify-center mt-[-40px]">
             <div className="text-8xl font-mono font-bold text-[#0A2463] mb-4">
               {currentTicket.ticket_code}
             </div>
             <div className="text-2xl text-gray-600 font-medium mb-2 border-b-2 inline-block px-4 pb-2" style={{borderColor: currentTicket.service.color}}>
               {currentTicket.service.name}
             </div>
             <div className="text-lg text-gray-500 flex items-center gap-2 mb-8 mt-2">
               {currentTicket.priority.icon} {currentTicket.priority.name}
             </div>

             <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <button onClick={() => handleAction('complete', currentTicket.id)} disabled={submitting} className="col-span-2 bg-[#4CAF82] hover:bg-[#3d8c68] text-white py-4 rounded-xl text-xl font-bold shadow-md transition-transform hover:scale-105">
                  ✅ Turno Atendido
                </button>
                <button onClick={() => handleAction('recall', currentTicket.id)} disabled={submitting} className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl font-semibold">
                  🔁 Rellamar
                </button>
                <button onClick={() => handleAction('skip', currentTicket.id)} disabled={submitting} className="bg-orange-100 hover:bg-orange-200 text-orange-700 py-3 rounded-xl font-semibold">
                  ⏩ Saltar / Fin Cola
                </button>
                <button onClick={() => handleAction('absent', currentTicket.id)} disabled={submitting} className="col-span-2 bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-xl font-semibold mt-2">
                  ❌ Ausente (No se presentó)
                </button>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center flex-1 w-full justify-center text-gray-400 mt-[-40px]">
            <div className="text-9xl mb-4">☕</div>
            <p className="text-xl">Ventanilla Disponible</p>
            <button 
               onClick={() => handleAction('attend', waitingTickets[0]?.id)}
               disabled={submitting || waitingTickets.length === 0}
               className="mt-8 bg-[#0A2463] hover:bg-[#081b4b] text-white py-4 px-8 rounded-xl text-xl font-bold shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
               ⏭ Llamar Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Columna Derecha — Estadísticas del Día */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col p-6">
        <h2 className="text-xl font-bold text-gray-700 mb-6">Mis Estadísticas (Hoy)</h2>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-50 border p-4 rounded-lg flex justify-between items-center">
             <span className="text-gray-600 font-medium">Atendidos</span>
             <span className="text-2xl font-bold text-[#4CAF82]">{myCompleted.length}</span>
          </div>
          <div className="bg-gray-50 border p-4 rounded-lg flex justify-between items-center">
             <span className="text-gray-600 font-medium">Tiempo Promedio</span>
             <span className="text-2xl font-bold text-[#00838F]">{avgAttendTime} min</span>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Cola de Espera Total</h3>
            <div className="bg-gray-50 border p-4 rounded-lg flex flex-col gap-2">
               <div className="flex justify-between items-center">
                 <span className="text-gray-600">Total Pacientes:</span>
                 <span className="font-bold text-xl">{waitingTickets.length}</span>
               </div>
               
               {/* Quick Breakdown */}
               <div className="flex flex-wrap gap-2 mt-2">
                  {[1,2,3,4].map(level => {
                    const count = waitingTickets.filter(t => t.priority.level === level).length;
                    if(count === 0) return null;
                    return (
                      <span key={level} className="text-xs border px-2 py-1 rounded-md mb-1 bg-white">
                        Lvl {level}: <b>{count}</b>
                      </span>
                    )
                  })}
               </div>
            </div>
          </div>
        </div>
       </div>
      </div>
    </div>
  );
}
