import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import VoiceConfigForm from "./VoiceConfigForm";

export default async function VozConfigPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div>No tienes una entidad asignada</div>;

  const supabase = createClient();
  const { data: displayConfig } = await supabase
    .from("display_config")
    .select("voice_settings_json")
    .eq("entity_id", entityId)
    .single();

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2463]">Llamado por Voz (TTS)</h1>
          <p className="text-gray-500">Configura la síntesis de voz que anunciará los turnos en la pantalla pública.</p>
        </div>
      </div>

      <VoiceConfigForm
        initialSettings={displayConfig?.voice_settings_json ?? {}}
      />
    </div>
  );
}
