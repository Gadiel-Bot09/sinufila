import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import { toggleOperatorActive, updateOperatorWindow } from "./actions";
import InviteOperatorForm from "./InviteOperatorForm";

export default async function OperadoresPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div className="p-8 text-red-600">No tienes una entidad asignada.</div>;

  const supabase = createClient();
  const { data: operators } = await supabase
    .from('operators')
    .select('*, window:windows(name, number)')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true });

  const { data: windows } = await supabase
    .from('windows')
    .select('id, name, number')
    .eq('entity_id', entityId)
    .eq('is_active', true);

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    operator: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2463]">Operadores y Personal</h1>
        <p className="text-gray-500">Gestiona el equipo de atención y sus ventanillas asignadas.</p>
      </div>

      {/* Formulario invitar operador */}
      <InviteOperatorForm windows={windows} />

      {/* Lista de operadores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            Equipo de Atención ({operators?.length || 0})
          </h2>
        </div>

        {operators && operators.length > 0 ? (
          <div className="divide-y">
            {operators.map(op => (
              <div key={op.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#0A2463] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {op.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">{op.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColors[op.role as 'admin' | 'operator'] || 'bg-gray-100 text-gray-600'}`}>
                      {op.role === 'admin' ? '👑 Admin' : '🧑‍💼 Operador'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {op.window
                      ? `📍 Ventanilla ${op.window.number} — ${op.window.name}`
                      : '📍 Sin ventanilla asignada'}
                  </p>
                </div>

                {/* Cambiar ventanilla */}
                <form action={updateOperatorWindow.bind(null, op.id)} className="flex items-center gap-2">
                  <select
                    name="windowId"
                    defaultValue={op.window_id || ''}
                    className="text-sm border rounded-md px-2 py-1.5 bg-gray-50 focus:outline-none"
                  >
                    <option value="">Sin ventanilla</option>
                    {windows?.map(w => (
                      <option key={w.id} value={w.id}>
                        V.{w.number} — {w.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="text-xs text-blue-600 hover:underline px-1">
                    ✓
                  </button>
                </form>

                {/* Estado */}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${op.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {op.is_active ? 'Activo' : 'Inactivo'}
                </span>

                <form action={toggleOperatorActive.bind(null, op.id, op.is_active)}>
                  <button type="submit" className="text-sm text-blue-600 hover:underline shrink-0">
                    {op.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg font-medium">Aún no hay operadores</p>
            <p className="text-sm mt-1">Invita a tu primer operador usando el formulario de arriba.</p>
          </div>
        )}
      </div>
    </div>
  );
}
