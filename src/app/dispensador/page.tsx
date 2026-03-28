import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import DispensadorFlow from "./DispensadorFlow";

export default async function DispensadorPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div className="p-8 text-center text-red-500">Error: No autorizado o no configurado.</div>;

  const supabase = createClient();
  
  const [servicesRes, prioritiesRes, printConfigRes, entityRes] = await Promise.all([
    supabase.from('services').select('*').eq('entity_id', entityId).eq('is_active', true).order('name'),
    supabase.from('priority_levels').select('*').eq('entity_id', entityId).eq('is_active', true).order('level'),
    supabase.from('ticket_print_config').select('*').eq('entity_id', entityId).single(),
    supabase.from('entities').select('*').eq('id', entityId).single()
  ]);

  return (
    <DispensadorFlow 
      services={servicesRes.data || []} 
      priorities={prioritiesRes.data || []} 
      printConfig={printConfigRes.data || {}} 
      entity={entityRes.data || {}}
    />
  );
}
