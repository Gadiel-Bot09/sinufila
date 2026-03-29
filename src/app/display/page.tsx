import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import DisplayClient from "./DisplayClient";

interface Props {
  searchParams: { entity?: string };
}

export default async function DisplayPage({ searchParams }: Props) {
  const supabase = createClient();

  // Modo público (TV/pantalla): ?entity=UUID
  // Modo admin logueado: obtiene el entityId del operador autenticado
  let entityId = searchParams?.entity ?? null;

  if (!entityId) {
    entityId = await getCurrentEntityId();
  }

  if (!entityId) {
    return (
      <div className="min-h-screen bg-[#0A2463] flex items-center justify-center text-white text-center p-8">
        <div>
          <div className="text-6xl mb-6">📺</div>
          <h1 className="text-3xl font-black mb-4">Pantalla Pública SinuFila</h1>
          <p className="text-blue-200 text-lg mb-6">
            Para usar la pantalla pública, abre con el parámetro de tu institución:
          </p>
          <code className="block bg-white/10 rounded-xl p-4 text-blue-100 font-mono text-sm break-all">
            /display?entity=TU_ENTITY_ID
          </code>
          <p className="text-blue-300 text-sm mt-6">
            Encontrarás tu Entity ID en el Admin → Mi Institución.
          </p>
        </div>
      </div>
    );
  }

  // Verificar que la entidad existe
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('id, name, logo_url')
    .eq('id', entityId)
    .single();

  if (entityError || !entity) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400 text-xl">
        Institución no encontrada. Verifica el parámetro entity en la URL.
      </div>
    );
  }

  const { data: config } = await supabase
    .from('display_config')
    .select('*')
    .eq('entity_id', entityId)
    .single();

  return (
    <DisplayClient
      config={config || {}}
      entity={entity}
      entityId={entityId}
    />
  );
}
