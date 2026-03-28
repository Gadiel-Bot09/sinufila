import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";

export default async function ReportesPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div>No tienes una entidad asignada</div>;

  const supabase = createClient();
  
  // Calculate basic stats for the day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, priority:priority_levels(name, level), service:services(name)')
    .eq('entity_id', entityId)
    .gte('created_at', today.toISOString());

  const totalToday = tickets?.length || 0;
  const completed = tickets?.filter(t => t.status === 'completed') || [];
  const waiting = tickets?.filter(t => t.status === 'waiting') || [];
  const abandoned = tickets?.filter(t => t.status === 'absent' || t.status === 'skipped') || [];

  const avgWaitTimeSeconds = completed.reduce((acc, t) => acc + (t.wait_time_seconds || 0), 0) / (completed.length || 1);
  const avgWaitTimeMin = Math.round(avgWaitTimeSeconds / 60);

  const avgAttendTimeSeconds = completed.reduce((acc, t) => acc + (t.attend_time_seconds || 0), 0) / (completed.length || 1);
  const avgAttendTimeMin = Math.round(avgAttendTimeSeconds / 60);

  const priorityBreakdown = (level: number) => tickets?.filter(t => t.priority?.level === level).length || 0;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2463]">Reportes y Estadísticas</h1>
          <p className="text-gray-500">Métricas operativas en tiempo real de la jornada actual.</p>
        </div>
        <button className="bg-white border rounded-md px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50">
          Exportar a CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500 mb-1">Turnos Emitidos (Hoy)</p>
          <h3 className="text-3xl font-bold text-gray-800">{totalToday}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-500 mb-1">Turnos Atendidos</p>
          <h3 className="text-3xl font-bold text-gray-800">{completed.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
          <p className="text-sm text-gray-500 mb-1">En Espera Actual</p>
          <h3 className="text-3xl font-bold text-gray-800">{waiting.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <p className="text-sm text-gray-500 mb-1">Abandono / Ausentes</p>
          <h3 className="text-3xl font-bold text-gray-800">{abandoned.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        
        {/* Tiempos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Métricas de Tiempo Promedio</h2>
          
          <div className="flex justify-around items-center text-center">
            <div>
              <div className="w-24 h-24 rounded-full border-4 border-orange-400 flex items-center justify-center mx-auto mb-4">
                 <span className="text-2xl font-bold text-gray-800">{avgWaitTimeMin}</span>
                 <span className="text-xs text-gray-500 ml-1">min</span>
              </div>
              <p className="font-semibold text-gray-700">Tiempo de Espera</p>
            </div>

            <div>
              <div className="w-24 h-24 rounded-full border-4 border-[#00838F] flex items-center justify-center mx-auto mb-4">
                 <span className="text-2xl font-bold text-gray-800">{avgAttendTimeMin}</span>
                 <span className="text-xs text-gray-500 ml-1">min</span>
              </div>
              <p className="font-semibold text-gray-700">Tiempo de Atención</p>
            </div>
          </div>
        </div>

        {/* Breakdown Prioridades */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Distribución por Prioridad</h2>
          <div className="flex flex-col gap-4">
            {[1,2,3,4].map(level => {
              const count = priorityBreakdown(level);
              const percentage = totalToday > 0 ? Math.round((count / totalToday) * 100) : 0;
              return (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">Nivel {level}</span>
                    <span className="text-gray-500">{count} turnos ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-[#0A2463] h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
