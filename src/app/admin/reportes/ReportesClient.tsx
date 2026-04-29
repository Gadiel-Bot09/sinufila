'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

interface Ticket {
  id: string;
  ticket_code: string;
  status: string;
  created_at: string;
  attended_at: string | null;
  completed_at: string | null;
  wait_time_seconds: number | null;
  attend_time_seconds: number | null;
  service: { name: string; color: string } | null;
  priority: { name: string; level: number; color: string } | null;
  window: { name: string; number: string } | null;
  operator: { name: string } | null;
}

interface Props {
  tickets: Ticket[];
  entityId: string;
  availableDates: string[];
  selectedDate: string;
}

const TICKETS_PER_PAGE = 50;

function formatTimeCO(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' });
}
function formatDateLabel(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

const STATUS_BADGE: Record<string, string> = {
  waiting:   'bg-orange-100 text-orange-700',
  attending: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  absent:    'bg-red-100 text-red-700',
  skipped:   'bg-gray-100 text-gray-600',
};
const STATUS_LABEL: Record<string, string> = {
  waiting: 'En Espera', attending: 'En Atención', completed: 'Atendido', absent: 'Ausente', skipped: 'Saltado',
};

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5">
      <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function getHourlyData(tickets: Ticket[]) {
  const counts: number[] = new Array(17).fill(0);
  for (const t of tickets) {
    const h = new Date(t.created_at).toLocaleString('en-US', { timeZone: 'America/Bogota', hour: 'numeric', hour12: false });
    const idx = parseInt(h) - 6;
    if (idx >= 0 && idx < 17) counts[idx]++;
  }
  return counts;
}

// ─── Operator metrics ─────────────────────────────────────────────────────────
interface OpStat {
  name: string;
  attended: number;
  skipped: number;
  avgAttendMin: number;
  totalMin: number;
}

function buildOperatorStats(tickets: Ticket[]): OpStat[] {
  const map = new Map<string, { attended: Ticket[]; skipped: number }>();

  for (const t of tickets) {
    const name = t.operator?.name ?? 'Sin asignar';
    if (!map.has(name)) map.set(name, { attended: [], skipped: 0 });
    const entry = map.get(name)!;
    if (t.status === 'completed') entry.attended.push(t);
    if (t.status === 'skipped' || t.status === 'absent') entry.skipped++;
  }

  return Array.from(map.entries())
    .map(([name, data]) => {
      const totalSecs = data.attended.reduce((a, t) => a + (t.attend_time_seconds || 0), 0);
      const avgAttendMin = data.attended.length > 0 ? Math.round(totalSecs / data.attended.length / 60) : 0;
      return {
        name,
        attended: data.attended.length,
        skipped: data.skipped,
        avgAttendMin,
        totalMin: Math.round(totalSecs / 60),
      };
    })
    .filter(s => s.name !== 'Sin asignar' || s.attended > 0)
    .sort((a, b) => b.attended - a.attended);
}

export default function ReportesClient({ tickets, entityId: _entityId, availableDates, selectedDate }: Props) {
  const router = useRouter();
  const [view, setView] = useState<'summary' | 'detail' | 'operadores'>('summary');
  const [page, setPage] = useState(1);

  const total      = tickets.length;
  const completed  = tickets.filter(t => t.status === 'completed');
  const waiting    = tickets.filter(t => t.status === 'waiting');
  const attending  = tickets.filter(t => t.status === 'attending');
  const abandoned  = tickets.filter(t => t.status === 'absent' || t.status === 'skipped');

  const avgWait    = completed.length ? Math.round(completed.reduce((a, t) => a + (t.wait_time_seconds || 0), 0) / completed.length / 60) : 0;
  const avgAttend  = completed.length ? Math.round(completed.reduce((a, t) => a + (t.attend_time_seconds || 0), 0) / completed.length / 60) : 0;
  const eficiency  = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  // Service breakdown
  const svcMap: Record<string, { count: number; color: string }> = {};
  for (const t of tickets) {
    const name = t.service?.name || 'Desconocido';
    if (!svcMap[name]) svcMap[name] = { count: 0, color: t.service?.color || '#ccc' };
    svcMap[name].count++;
  }

  // Priority breakdown
  const prioMap: Record<number, number> = {};
  for (const t of tickets) {
    const lvl = t.priority?.level ?? 0;
    prioMap[lvl] = (prioMap[lvl] || 0) + 1;
  }
  const prioColors: Record<number, string> = { 1: '#E63946', 2: '#FF6B35', 3: '#FFD166', 4: '#4CAF82' };

  const hourlyData = getHourlyData(tickets);
  const maxHourly  = Math.max(...hourlyData, 1);
  const hours      = Array.from({ length: 17 }, (_, i) => `${(6 + i).toString().padStart(2, '0')}h`);

  // Operator stats (memoized)
  const operatorStats = useMemo(() => buildOperatorStats(tickets), [tickets]);

  // Paginated detail
  const totalPages   = Math.max(1, Math.ceil(tickets.length / TICKETS_PER_PAGE));
  const pagedTickets = tickets.slice((page - 1) * TICKETS_PER_PAGE, page * TICKETS_PER_PAGE);

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(1);
    router.push(`/admin/reportes?date=${e.target.value}`);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2463]">Reportes y Estadísticas</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">{formatDateLabel(selectedDate)} • Hora Colombia</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date picker */}
          <select
            value={selectedDate}
            onChange={handleDateChange}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A2463]/20"
          >
            {availableDates.map(d => (
              <option key={d} value={d}>
                {new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['summary', 'detail', 'operadores'] as const).map(v => (
              <button key={v} onClick={() => { setView(v); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === v ? 'bg-white shadow text-[#0A2463]' : 'text-gray-500 hover:text-gray-700'}`}>
                {v === 'summary' ? '📊 Resumen' : v === 'detail' ? '📋 Detalle' : '👥 Operadores'}
              </button>
            ))}
          </div>

          {/* CSV Export */}
          <a
            href={`/api/reportes/export?date=${selectedDate}T05:00:00.000Z`}
            className="flex items-center gap-1.5 bg-[#0A2463] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#081b4b] transition-all shadow-sm"
          >
            ⬇ Exportar CSV
          </a>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Emitidos',    value: total,             icon: '🎟',    color: '#3B82F6' },
          { label: 'Atendidos',   value: completed.length,  icon: '✅',    color: '#4CAF82' },
          { label: 'En Espera',   value: waiting.length,    icon: '⏳',    color: '#FF6B35' },
          { label: 'En Atención', value: attending.length,  icon: '🧑‍💼', color: '#00838F' },
          { label: 'Abandonos',   value: abandoned.length,  icon: '❌',    color: '#E63946' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 border-l-4" style={{ borderLeftColor: kpi.color }}>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{kpi.label}</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-gray-800">{kpi.value}</h3>
              <span className="text-xl mb-0.5">{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── SUMMARY ── */}
      {view === 'summary' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tiempos */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-5">⏱ Tiempos Promedio</h2>
              <div className="flex gap-6 justify-center mb-5">
                {[
                  { val: avgWait, label: 'Espera', color: '#FF6B35' },
                  { val: avgAttend, label: 'Atención', color: '#00838F' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center mx-auto mb-2"
                      style={{ borderColor: m.color }}>
                      <span className="text-2xl font-bold text-gray-800">{m.val}</span>
                      <span className="text-xs text-gray-400">min</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-600">{m.label}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 font-medium">Eficiencia del día</span>
                  <span className="font-bold text-[#0A2463]">{eficiency}%</span>
                </div>
                <MiniBar pct={eficiency} color="#4CAF82" />
              </div>
            </div>

            {/* Por Servicio */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-5">🏷 Por Servicio</h2>
              <div className="space-y-3">
                {Object.entries(svcMap).sort(([, a], [, b]) => b.count - a.count).map(([name, { count, color }]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium truncate max-w-28">{name}</span>
                      <span className="text-gray-500">{count} <span className="text-gray-400">({total > 0 ? Math.round(count / total * 100) : 0}%)</span></span>
                    </div>
                    <MiniBar pct={total > 0 ? Math.round(count / total * 100) : 0} color={color} />
                  </div>
                ))}
                {Object.keys(svcMap).length === 0 && <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>}
              </div>
            </div>

            {/* Por Prioridad */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-5">🎯 Por Prioridad</h2>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(level => {
                  const count = prioMap[level] || 0;
                  const pct = total > 0 ? Math.round(count / total * 100) : 0;
                  return (
                    <div key={level}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 font-medium">Nivel {level}</span>
                        <span className="text-gray-500">{count} <span className="text-gray-400">({pct}%)</span></span>
                      </div>
                      <MiniBar pct={pct} color={prioColors[level] ?? '#ccc'} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hourly chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5">📈 Distribución por Hora</h2>
            <div className="flex items-end gap-1 h-28">
              {hourlyData.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">{count > 0 ? count : ''}</span>
                  <div className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.round((count / maxHourly) * 80)}px`,
                      minHeight: count > 0 ? '4px' : '0',
                      background: count > 0 ? 'linear-gradient(to top, #0A2463, #00838F)' : '#f3f4f6',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1 mt-1">
              {hours.map(h => (
                <div key={h} className="flex-1 text-center text-xs text-gray-400">{h}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── DETAIL with pagination ── */}
      {view === 'detail' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-bold text-gray-800">Detalle de Turnos ({total})</h2>
            {total > TICKETS_PER_PAGE && (
              <span className="text-xs text-gray-400">
                Mostrando {((page - 1) * TICKETS_PER_PAGE) + 1}–{Math.min(page * TICKETS_PER_PAGE, total)} de {total}
              </span>
            )}
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">📋</div>
              <p className="font-medium">No hay tickets para este día</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr className="text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Turno</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Servicio</th>
                      <th className="px-4 py-3 text-left">Prioridad</th>
                      <th className="px-4 py-3 text-left">Emisión</th>
                      <th className="px-4 py-3 text-left">Atención</th>
                      <th className="px-4 py-3 text-right">Espera</th>
                      <th className="px-4 py-3 text-left">Ventanilla</th>
                      <th className="px-4 py-3 text-left">Operador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pagedTickets.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#0A2463]">{t.ticket_code}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[t.status] ?? t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.service ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.service.color }} />
                              {t.service.name}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {t.priority ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded text-white" style={{ backgroundColor: t.priority.color }}>
                              Lvl {t.priority.level}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatTimeCO(t.created_at)}</td>
                        <td className="px-4 py-3 text-gray-600">{t.attended_at ? formatTimeCO(t.attended_at) : '—'}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {t.wait_time_seconds ? `${Math.round(t.wait_time_seconds / 60)} min` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{t.window ? `V.${t.window.number}` : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{t.operator?.name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-gray-500 font-medium">
                    Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── OPERADORES ── */}
      {view === 'operadores' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="font-bold text-gray-800">👥 Rendimiento por Operador</h2>
            <p className="text-xs text-gray-400 mt-1">{selectedDate} • basado en turnos completados</p>
          </div>

          {operatorStats.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">👥</div>
              <p className="font-medium">Sin datos de operadores para este día</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Operador</th>
                    <th className="px-4 py-3 text-center">Atendidos</th>
                    <th className="px-4 py-3 text-center">Saltados / Ausentes</th>
                    <th className="px-4 py-3 text-center">T. Prom. Atención</th>
                    <th className="px-4 py-3 text-center">T. Total Atendido</th>
                    <th className="px-4 py-3 text-left">Eficiencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {operatorStats.map((op, i) => {
                    const totalOp = op.attended + op.skipped;
                    const ef = totalOp > 0 ? Math.round((op.attended / totalOp) * 100) : 0;
                    return (
                      <tr key={op.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0A2463]/10 flex items-center justify-center text-[#0A2463] font-bold text-sm shrink-0">
                              {i + 1}
                            </div>
                            <span className="font-semibold text-gray-800">{op.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-2xl font-black text-green-600">{op.attended}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-lg font-bold ${op.skipped > 0 ? 'text-red-500' : 'text-gray-300'}`}>{op.skipped}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-lg font-bold text-[#00838F]">{op.avgAttendMin} <span className="text-xs font-normal text-gray-400">min</span></span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-gray-600">{op.totalMin} min</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${ef}%`, backgroundColor: ef >= 80 ? '#4CAF82' : ef >= 50 ? '#FF6B35' : '#E63946' }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-600 w-10 text-right">{ef}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
