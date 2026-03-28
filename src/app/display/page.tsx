import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import DisplayClient from "./DisplayClient";

export default async function DisplayPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div className="p-8 text-center text-red-500 bg-black h-screen">Error: No autorizado o no configurado.</div>;

  const supabase = createClient();
  
  const [configRes, entityRes] = await Promise.all([
    supabase.from('display_config').select('*').eq('entity_id', entityId).single(),
    supabase.from('entities').select('*').eq('id', entityId).single()
  ]);

  return (
    <DisplayClient 
      config={configRes.data || {}} 
      entity={entityRes.data || {}}
      entityId={entityId}
    />
  );
}
