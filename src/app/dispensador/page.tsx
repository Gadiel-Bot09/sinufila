import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import DispensadorFlow from "./DispensadorFlow";

interface Props {
  searchParams: { entity?: string };
}

export default async function DispensadorPage({ searchParams }: Props) {
  const supabase = createClient();

  // Modo público (kiosk): se pasa ?entity=UUID en la URL
  // Modo admin logueado: se obtiene del operador autenticado
  let entityId = searchParams?.entity ?? null;

  if (!entityId) {
    // Intenta obtenerlo del usuario logueado (modo admin que abre el kiosk)
    entityId = await getCurrentEntityId();
  }

  if (!entityId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2463] to-[#00838F]">
        <div className="bg-white rounded-2xl p-10 max-w-md text-center shadow-2xl">
          <div className="text-6xl mb-4">🎫</div>
          <h1 className="text-2xl font-black text-[#0A2463] mb-3">Kiosk de Turnos</h1>
          <p className="text-gray-500 mb-6">
            Para usar el dispensador público, abre esta URL con el parámetro de tu institución:
          </p>
          <code className="block bg-gray-100 rounded-lg p-3 text-sm text-gray-700 font-mono break-all">
            /dispensador?entity=TU_ENTITY_ID
          </code>
          <p className="text-xs text-gray-400 mt-4">
            Puedes encontrar tu Entity ID en el panel de administración → Mi Institución.
          </p>
        </div>
      </div>
    );
  }

  // Verificar que la entidad existe (seguridad mínima)
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('id, name, logo_url, config_json')
    .eq('id', entityId)
    .single();

  if (entityError || !entity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-700">Institución no encontrada</h1>
          <p className="text-red-500 mt-2">El ID de entidad proporcionado no existe.</p>
        </div>
      </div>
    );
  }

  // Verificar si la jornada está cerrada
  const entityConfig = (entity?.config_json as Record<string, unknown>) ?? {};
  const isJornadaOpen = entityConfig.is_open !== false; // abierta por defecto

  if (!isJornadaOpen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0A2463] to-[#163580] text-white p-8">
        <div className="bg-white/10 backdrop-blur rounded-3xl p-12 max-w-md text-center border border-white/20">
          <div className="text-7xl mb-6">🔒</div>
          <h1 className="text-3xl font-black mb-3">Jornada Cerrada</h1>
          <p className="text-blue-200 text-lg mb-2">
            El servicio de turnos de <strong>{entity.name}</strong> no está disponible en este momento.
          </p>
          <p className="text-blue-300 text-sm">
            Por favor vuelve durante el horario de atención o consulta con el personal.
          </p>
        </div>
        <p className="text-blue-400 text-xs mt-8">SinuFila • Sistema de Gestión de Turnos</p>
      </div>
    );
  }

  const [servicesRes, prioritiesRes, printConfigRes] = await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('entity_id', entityId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('priority_levels')
      .select('*')
      .eq('entity_id', entityId)
      .eq('is_active', true)
      .order('level'),
    supabase
      .from('ticket_print_config')
      .select('*')
      .eq('entity_id', entityId)
      .single(),
  ]);

  return (
    <DispensadorFlow
      entityId={entityId}
      services={servicesRes.data || []}
      priorities={prioritiesRes.data || []}
      printConfig={printConfigRes.data || {}}
      entity={entity}
    />
  );
}
