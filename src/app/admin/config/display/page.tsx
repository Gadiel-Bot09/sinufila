import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import { updateDisplayConfig } from "./actions";

export default async function DisplayConfigPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div>No tienes una entidad asignada</div>;

  const supabase = createClient();
  const { data: config } = await supabase
    .from("display_config")
    .select("video_url, ticker_text")
    .eq("entity_id", entityId)
    .single();

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2463]">Pantalla Pública</h1>
          <p className="text-gray-500">Configura el video de entretenimiento y los mensajes que ven los clientes mientras esperan.</p>
        </div>
      </div>

      <form action={updateDisplayConfig} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL del Video (YouTube Embed o MP4)</label>
          <input 
            name="video_url" 
            defaultValue={config?.video_url || ''} 
            placeholder="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1"
            className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]" 
          />
          <p className="text-xs text-gray-500 mt-1">
            Si usas YouTube, asegúrate de usar la URL de <b>embed</b> y agregar `?autoplay=1&mute=1&loop=1` para que se reproduzca automáticamente sin sonido.
          </p>
        </div>

        {config?.video_url && (
          <div className="aspect-video w-full rounded-md overflow-hidden bg-black border">
            <iframe 
              src={config.video_url} 
              allow="autoplay; encrypted-media" 
              allowFullScreen 
              className="w-full h-full border-none"
            ></iframe>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Texto del Ticker (Marquesina inferior)</label>
          <textarea 
            name="ticker_text" 
            rows={3}
            defaultValue={config?.ticker_text || ''} 
            placeholder="Escribe aquí el mensaje rodante que aparecerá en la parte inferior..."
            className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]" 
          />
        </div>

        <div className="mt-2 pt-4 border-t">
          <button type="submit" className="bg-[#0A2463] text-white px-4 py-2 rounded-md hover:bg-[#081b4b] transition-colors">
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
}
