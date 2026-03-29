import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import { getStartOfDayColombia, getCurrentDateLabelColombia } from "@/lib/timezone";
import Link from "next/link";
import JornadaWidget from "../JornadaWidget";

export default async function AdminDashboardPage() {
  const entityId = await getCurrentEntityId();
  const todayLabel = getCurrentDateLabelColombia();

  if (!entityId) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="text-6xl mb-6">🏗️</div>
        <h1 className="text-2xl font-bold text-[#0A2463] mb-4">Configura tu Entidad</h1>
        <p className="text-gray-600 mb-8">
          Tu cuenta está lista. Ahora necesitas configurar los datos de tu institución para comenzar a usar SinuFila.
        </p>
        <Link
          href="/admin/config"
          className="bg-[#0A2463] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#081b4b] transition-colors inline-block"
        >
          ⚙️ Ir a Configuración
        </Link>
      </div>
    );
  }

  const supabase = createClient();
  const startOfDay = getStartOfDayColombia();

  const [
    { data: entity },
    { data: tickets },
    { data: operators },
    { data: windows },
    { data: services },
  ] = await Promise.all([
    supabase.from('entities').select('name, config_json').eq('id', entityId).single(),
    supabase.from('tickets').select('status, attend_time_seconds').eq('entity_id', entityId).gte('created_at', startOfDay.toISOString()),
    supabase.from('operators').select('id, is_active').eq('entity_id', entityId),
    supabase.from('windows').select('id, is_active').eq('entity_id', entityId),
    supabase.from('services').select('id, is_active').eq('entity_id', entityId),
  ]);

  const entityConfig = (entity?.config_json as Record<string, unknown>) ?? {};
  const isJornadaOpen = entityConfig.is_open !== false; // abierta por defecto

  const totalToday = tickets?.length || 0;
  const completed = tickets?.filter(t => t.status === 'completed') || [];
  const waiting = tickets?.filter(t => t.status === 'waiting') || [];
  const attending = tickets?.filter(t => t.status === 'attending') || [];
  const activeWindows = windows?.filter(w => w.is_active).length || 0;
  const activeOperators = operators?.filter(op => op.is_active).length || 0;
  const avgAttend = completed.length
    ? Math.round(completed.reduce((a, t) => a + (t.attend_time_seconds || 0), 0) / completed.length / 60)
    : 0;

  const eficiencia = totalToday > 0 ? Math.round((completed.length / totalToday) * 100) : 0;

  const kpis = [
    { label: 'Turnos Hoy', value: totalToday, icon: '🎟', color: 'border-l-blue-500', sub: 'emitidos' },
    { label: 'Atendidos', value: completed.length, icon: '✅', color: 'border-l-green-500', sub: `${eficiencia}% eficiencia` },
    { label: 'En Espera', value: waiting.length, icon: '⏳', color: 'border-l-orange-500', sub: 'en cola ahora' },
    { label: 'En Atención', value: attending.length, icon: '🧑‍💼', color: 'border-l-teal-500', sub: 'siendo atendidos' },
    { label: 'Ventanillas Activas', value: activeWindows, icon: '🏢', color: 'border-l-purple-500', sub: `de ${windows?.length || 0} totales` },
    { label: 'Operadores Activos', value: activeOperators, icon: '👥', color: 'border-l-indigo-500', sub: `de ${operators?.length || 0} totales` },
    { label: 'Tiempo Prom. Atención', value: `${avgAttend}`, icon: '⏱', color: 'border-l-[#00838F]', sub: 'minutos por turno' },
    { label: 'Servicios', value: services?.filter(s => s.is_active).length || 0, icon: '📋', color: 'border-l-gray-400', sub: 'activos' },
  ];

  const shortcuts = [
    { href: '/admin/config/servicios', label: 'Servicios', icon: '📋' },
    { href: '/admin/config/prioridades', label: 'Prioridades', icon: '🎯' },
    { href: '/admin/config/ventanillas', label: 'Ventanillas', icon: '🏢' },
    { href: '/admin/config/operadores', label: 'Operadores', icon: '👥' },
    { href: '/admin/config/voz', label: 'Voz TTS', icon: '🔊' },
    { href: '/admin/reportes', label: 'Ver Reportes', icon: '📊' },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2463]">
          Dashboard — {entity?.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">📅 {todayLabel} &nbsp;•&nbsp; Hora Colombia (UTC-5)</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 ${kpi.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider leading-tight">{kpi.label}</p>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">
              {kpi.value}
              {kpi.label === 'Tiempo Prom. Atención' && <span className="text-base font-normal text-gray-500 ml-1">min</span>}
            </h3>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom Row: Jornada + Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Jornada Widget */}
        <JornadaWidget isOpen={isJornadaOpen} entityId={entityId} />

        {/* Acciones Rápidas */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">⚡ Accesos Rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {shortcuts.map(s => (
              <Link
                key={s.href}
                href={s.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-[#0A2463] hover:text-white transition-all group text-center"
              >
                <span className="text-3xl">{s.icon}</span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-white">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
