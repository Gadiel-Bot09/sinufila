import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import OperadorClient from "./OperadorClient";
import OperadorWindowSelector from "./OperadorWindowSelector";

interface Props {
  searchParams: { ready?: string };
}

export default async function OperadorPage({ searchParams }: Props) {
  const entityId = await getCurrentEntityId();
  if (!entityId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso Restringido</h1>
          <p className="text-gray-500">No estás registrado como operador de ninguna entidad. Contacta a tu administrador.</p>
        </div>
      </div>
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Operator con ventanilla joinada
  const { data: operator } = await supabase
    .from('operators')
    .select('*, window:windows(id, name, number)')
    .eq('user_id', user?.id)
    .single();

  if (!operator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-[#0A2463] mb-2">Operador no registrado</h1>
          <p className="text-gray-500">Tu cuenta no está registrada como operador. Pídele al administrador que te asigne una ventanilla.</p>
        </div>
      </div>
    );
  }

  // Todas las ventanillas activas
  const { data: allWindows } = await supabase
    .from('windows')
    .select('id, name, number')
    .eq('entity_id', entityId)
    .eq('is_active', true)
    .order('number');

  // ─── CAMBIO CLAVE ────────────────────────────────────────────────────────────
  // El selector se muestra SIEMPRE al inicio de sesión (?ready no presente).
  // Solo se salta si el operador ya confirmó su ventanilla en ESTA sesión (?ready=1).
  // Esto asegura que si el operador trabaja hoy en Consultorio 02 pero ayer
  // estuvo en Caja, pueda elegir correctamente sin quedar atrapado.
  const sessionReady = searchParams?.ready === '1' && !!operator.window_id;

  if (!sessionReady) {
    return (
      <OperadorWindowSelector
        operatorId={operator.id}
        operatorName={operator.name}
        currentWindowId={operator.window_id}   // para pre-seleccionar la última ventanilla
        windows={allWindows || []}
      />
    );
  }

  return (
    <OperadorClient
      entityId={entityId}
      operator={operator}
      allWindows={allWindows || []}
    />
  );
}
