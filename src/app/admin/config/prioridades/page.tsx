import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import { addPriority, togglePriorityActive, deletePriority } from "./actions";

export default async function PrioridadesConfigPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div>No tienes una entidad asignada</div>;

  const supabase = createClient();
  const { data: priorities } = await supabase
    .from("priority_levels")
    .select("*")
    .eq("entity_id", entityId)
    .order("level", { ascending: true });

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2463]">Niveles de Prioridad</h1>
          <p className="text-gray-500">Define los niveles de urgencia. Entre menor es el número (Nivel), mayor es la prioridad.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Prioridades */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {priorities?.length === 0 ? (
            <div className="bg-gray-50 text-gray-500 p-6 rounded-md text-center border border-dashed">
              Aún no has registrado ningún nivel de prioridad.
            </div>
          ) : (
            priorities?.map(prio => (
              <div key={prio.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-gray-50 border border-gray-200" style={{ borderColor: prio.color }}>
                    {prio.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                       {prio.name} 
                       <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-md font-mono border">Nvl. {prio.level}</span>
                    </h3>
                    <p className="text-sm text-gray-500">{prio.description}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-center">
                  <form action={togglePriorityActive.bind(null, prio.id, prio.is_active)}>
                    <button type="submit" className={`px-3 py-1 text-sm rounded-full ${prio.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {prio.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </form>
                  <form action={deletePriority.bind(null, prio.id)}>
                    <button type="submit" className="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Añadir Prioridad Forma */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Añadir Prioridad</h2>
          <form action={addPriority} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Categoria</label>
              <input name="name" placeholder="Ej. Alta Prioridad" className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel (1 = Mayor)</label>
                <input type="number" name="level" placeholder="1" min={1} className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icono (Emoji)</label>
                <input name="icon" placeholder="Ej. 🔴" className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" required />
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Color HEX</label>
               <input type="color" name="color" defaultValue="#FF6B35" className="w-full h-[42px] border rounded-md p-1 cursor-pointer bg-gray-50 focus:bg-white" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Breve</label>
              <input name="description" placeholder="Embarazadas, 3ra edad, etc." className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" />
            </div>

            <button type="submit" className="w-full bg-[#0A2463] text-white px-4 py-2 mt-2 rounded-md hover:bg-[#081b4b] transition-colors">
              Guardar Prioridad
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
