import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import { addService, toggleServiceActive, deleteService } from "./actions";

export default async function ServiciosConfigPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div>No tienes una entidad asignada</div>;

  const supabase = createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2463]">Configuración de Servicios</h1>
          <p className="text-gray-500">Administra los servicios de atención para la generación de turnos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Servicios */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {services?.length === 0 ? (
            <div className="bg-gray-50 text-gray-500 p-6 rounded-md text-center border border-dashed">
              Aún no has registrado ningún servicio.
            </div>
          ) : (
            services?.map(svc => (
              <div key={svc.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: svc.color || '#00838F' }}>
                    {svc.prefix}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{svc.name}</h3>
                    <p className="text-sm text-gray-500">Tiempo prom: {svc.avg_time_minutes} min</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-center">
                  <form action={toggleServiceActive.bind(null, svc.id, svc.is_active)}>
                    <button type="submit" className={`px-3 py-1 text-sm rounded-full ${svc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {svc.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </form>
                  <form action={deleteService.bind(null, svc.id)}>
                    <button type="submit" className="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Añadir Servicio Forma */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Añadir Servicio</h2>
          <form action={addService} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input name="name" placeholder="Ej. Laboratorio" className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo Letra</label>
                <input name="prefix" placeholder="Ej. L" maxLength={3} className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color HEX</label>
                <input type="color" name="color" defaultValue="#00838F" className="w-full h-[42px] border rounded-md p-1 cursor-pointer bg-gray-50 focus:bg-white" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Promedio (min)</label>
              <input type="number" name="avg_time_minutes" defaultValue={15} min={1} className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]" required />
            </div>

            <button type="submit" className="w-full bg-[#0A2463] text-white px-4 py-2 mt-2 rounded-md hover:bg-[#081b4b] transition-colors">
              Guardar Servicio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
