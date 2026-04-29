import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import DisplayConfigClient from "./DisplayConfigClient";

export default async function DisplayConfigPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div className="p-8 text-red-600">No tienes una entidad asignada.</div>;

  const supabase = createClient();
  const { data: config } = await supabase
    .from("display_config")
    .select("video_url, ticker_text")
    .eq("entity_id", entityId)
    .single();

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2463]">Pantalla Pública</h1>
        <p className="text-gray-500 mt-1">
          Configura el video de entretenimiento y los mensajes que ven los clientes mientras esperan.
        </p>
      </div>

      <DisplayConfigClient
        initialVideoUrl={config?.video_url || ''}
        initialTickerText={config?.ticker_text || ''}
      />
    </div>
  );
}
