import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import { getStartOfDayColombia, getCurrentDateLabelColombia } from "@/lib/timezone";

export default async function ReportesPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div>No tienes una entidad asignada</div>;

  const supabase = createClient();

  // Filtra tickets desde medianoche hora Colombia
  const startOfDay = getStartOfDayColombia();
  const todayLabel = getCurrentDateLabelColombia();

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, priority:priority_levels(name, level), service:services(name)')
    .eq('entity_id', entityId)
    .gte('created_at', startOfDay.toISOString());

  const totalToday = tickets?.length || 0;
  const completed = tickets?.filter(t => t.status === 'completed') || [];
  const waiting = tickets?.filter(t => t.status === 'waiting') || [];
  const attending = tickets?.filter(t => t.status === 'attending') || [];
  const abandoned = tickets?.filter(t => t.status === 'absent' || t.status === 'skipped') || [];

  const avgWaitSec = completed.reduce((acc, t) => acc + (t.wait_time_seconds || 0), 0) / (completed.length || 1);
  const avgWaitMin = Math.round(avgWaitSec / 60);
  const avgAttendSec = completed.reduce((acc, t) => acc + (t.attend_time_seconds || 0), 0) / (completed.length || 1);
  const avgAttendMin = Math.round(avgAttendSec / 60);

  // Servicios más demandados
  const serviceBreakdown = tickets?.reduce((acc: Record<string, number>, t) => {
    const name = t.service?.name || 'Desconocido';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {}) || {};

  const priorityBreakdown = (level: number) =>
    tickets?.filter(t => t.priority?.level === level).length || 0;

  const eficiencia = totalToday > 0 ? Math.round((completed.length / totalToday) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2463]">Reportes y Estadísticas</h1>
          <p className="text-gray-500 text-sm mt-1">
            📅 {todayLabel} &nbsp;•&nbsp; Hora Colombia (UTC-5)
          </p>
        </div>
        <a
          href={`/api/reportes/export?date=${startOfDay.toISOString()}`}
          className="bg-white border rounded-md px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          ⬇ Exportar CSV
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Emitidos Hoy', value: totalToday, color: 'blue-500', icon: '🎟' },
          { label: 'Atendidos', value: completed.length, color: 'green-500', icon: '✅' },
          { label: 'En Espera', value: waiting.length, color: 'orange-500', icon: '⏳' },
          { label: 'En Atención', value: attending.length, color: 'teal-500', icon: '🧑‍💼' },
          { label: 'Abandonos', value: abandoned.length, color: 'red-500', icon: '❌' },
        ].map(kpi => (
          <div
            key={kpi.label}
            className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-${kpi.color}`}
          >
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{kpi.label}</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-gray-800">{kpi.value}</h3>
              <span className="text-xl mb-0.5">{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tiempos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">⏱ Tiempos Promedio</h2>
          <div className="flex justify-around items-center text-center gap-4">
            <div>
              <div className="w-24 h-24 rounded-full border-4 border-orange-400 flex flex-col items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-gray-800">{avgWaitMin}</span>
                <span className="text-xs text-gray-500">min</span>
              </div>
              <p className="font-semibold text-gray-700 text-sm">Espera</p>
            </div>
            <div>
              <div className="w-24 h-24 rounded-full border-4 border-[#00838F] flex flex-col items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-gray-800">{avgAttendMin}</span>
                <span className="text-xs text-gray-500">min</span>
              </div>
              <p className="font-semibold text-gray-700 text-sm">Atención</p>
            </div>
          </div>

          {/* Eficiencia */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Eficiencia del día</span>
              <span className="font-bold text-[#0A2463]">{eficiencia}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-[#4CAF82] h-3 rounded-full transition-all"
                style={{ width: `${eficiencia}%` }}
              />
            </div>
          </div>
        </div>

        {/* Prioridades */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">🎯 Por Nivel de Prioridad</h2>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map(level => {
              const count = priorityBreakdown(level);
              const pct = totalToday > 0 ? Math.round((count / totalToday) * 100) : 0;
              const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-blue-500', 'bg-gray-400'];
              return (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">Nivel {level}</span>
                    <span className="text-gray-500">{count} <span className="text-gray-400">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`${colors[level]} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Servicios */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">🏷 Por Servicio</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(serviceBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([name, count]) => {
                const pct = totalToday > 0 ? Math.round((count / totalToday) * 100) : 0;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium truncate max-w-[130px]">{name}</span>
                      <span className="text-gray-500">{count} <span className="text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-[#00838F] h-2.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            {Object.keys(serviceBreakdown).length === 0 && (
              <p className="text-gray-400 text-sm text-center mt-4">Sin datos aún</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
