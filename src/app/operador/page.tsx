import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import OperadorClient from "./OperadorClient";

export default async function OperadorPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div className="p-8 text-center text-red-500">Error: No autorizado o no configurado.</div>;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get operator profile
  const { data: operator } = await supabase
    .from('operators')
    .select('*, window:windows(name, number)')
    .eq('user_id', user?.id)
    .single();

  if (!operator) {
    return <div className="p-8 text-center text-red-500">Error: No estás registrado como operador para esta entidad. Pídele al administrador que te asigne una ventanilla.</div>;
  }

  return (
    <OperadorClient entityId={entityId} operator={operator} />
  );
}
