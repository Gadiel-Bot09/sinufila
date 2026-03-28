import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import { updateEntity } from "./actions";

export default async function EntidadConfigPage() {
  const entityId = await getCurrentEntityId();
  const supabase = createClient();

  let entity = null;
  if (entityId) {
    const { data } = await supabase.from('entities').select('*').eq('id', entityId).single();
    entity = data;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2463]">Configuración de Entidad</h1>
        <p className="text-gray-500">Actualiza los datos básicos de tu organización.</p>
      </div>

      {!entityId ? (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md">
           No tienes una entidad asociada. Visita <a href="/api/demo-seed" className="underline font-bold">/api/demo-seed</a> para crear datos de prueba.
        </div>
      ) : (
        <form action={updateEntity} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Entidad</label>
            <input 
              name="name" 
              defaultValue={entity?.name || ''} 
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#00838F] focus:outline-none"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input 
              name="logo_url" 
              defaultValue={entity?.logo_url || ''} 
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#00838F] focus:outline-none"
              placeholder="https://ejemplo.com/logo.png"
            />
            {entity?.logo_url && (
              <div className="mt-2">
                <img src={entity.logo_url} alt="Logo Preview" className="h-16 object-contain border p-1 rounded-md" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horario de Atención</label>
            <input 
              name="hours" 
              defaultValue={entity?.config_json?.hours || ''} 
              placeholder="Ej. Lunes a Viernes 08:00 - 18:00"
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#00838F] focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <button type="submit" className="bg-[#0A2463] text-white px-4 py-2 rounded-md hover:bg-[#081b4b] transition-colors">
              Guardar Cambios
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
