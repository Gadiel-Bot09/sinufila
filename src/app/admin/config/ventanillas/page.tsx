import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import { addWindow, toggleWindowActive, deleteWindow } from "./actions";

export default async function VentanillasPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div className="p-8 text-red-600">No tienes una entidad asignada.</div>;

  const supabase = createClient();
  const { data: windows, error: fetchError } = await supabase
    .from('windows')
    .select('*, service:services(name, color)')
    .eq('entity_id', entityId)
    .order('number', { ascending: true });

  if (fetchError) {
    return <div className="p-8 text-red-600">Error al cargar ventanillas: {fetchError.message}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2463]">Ventanillas de Atención</h1>
        <p className="text-gray-500">Administra los puestos de atención disponibles en tu entidad.</p>
      </div>

      {/* Formulario nueva ventanilla */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Agregar Ventanilla</h2>
        <form action={addWindow} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              type="text"
              name="number"
              required
              placeholder="Ej: 1, 2, A..."
              className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00838F]"
            />
          </div>
          <div className="flex-[2] min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre descriptivo</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ej: Ventanilla Prioritaria, Caja General..."
              className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00838F]"
            />
          </div>
          <button
            type="submit"
            className="bg-[#0A2463] text-white px-6 py-2 rounded-md hover:bg-[#081b4b] transition-colors font-semibold"
          >
            + Agregar
          </button>
        </form>
      </div>

      {/* Lista de ventanillas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            Ventanillas registradas ({windows?.length || 0})
          </h2>
        </div>

        {windows && windows.length > 0 ? (
          <div className="divide-y">
            {windows.map(w => (
              <div key={w.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0A2463]/10 flex items-center justify-center text-[#0A2463] font-black text-xl">
                    {w.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{w.name}</h3>
                    <p className="text-sm text-gray-500">
                      {w.service
                        ? <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: w.service.color }}>{w.service.name}</span>
                        : <span className="text-xs text-gray-400">Sin servicio asignado</span>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {w.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                  <form action={toggleWindowActive.bind(null, w.id, w.is_active)}>
                    <button type="submit" className="text-sm text-blue-600 hover:underline">
                      {w.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>
                  <form action={deleteWindow.bind(null, w.id)}>
                    <button
                      type="submit"
                      className="text-sm text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-lg font-medium">No hay ventanillas creadas</p>
            <p className="text-sm mt-1">Agrega tu primera ventanilla arriba.</p>
          </div>
        )}
      </div>
    </div>
  );
}
