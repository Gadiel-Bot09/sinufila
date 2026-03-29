import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { updateWhatsAppConfig } from './actions';

export default async function WhatsAppConfigPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div className="p-8 text-red-600">No tienes una entidad asignada.</div>;

  const supabase = createClient();
  const { data: entity } = await supabase
    .from('entities')
    .select('config_json')
    .eq('id', entityId)
    .single();

  const config = (entity?.config_json as Record<string, string>) ?? {};

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2463]">Configuración de WhatsApp</h1>
        <p className="text-gray-500">
          Conecta tu propia instancia de <strong>Evolution API</strong> para enviar notificaciones de turnos interactivas, 100% gratis.
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <form action={updateWhatsAppConfig} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">URL del servidor (Evolution API)</label>
            <input
              type="url"
              name="evolution_url"
              defaultValue={config.evolution_url || ''}
              placeholder="Ej: https://evo.mi-dominio.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2463]"
            />
            <p className="text-xs text-gray-400">La URL base donde tienes instalada tu Evolution API (sin barra al final).</p>
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">API Key (Global o Instance)</label>
            <input
              type="text"
              name="evolution_key"
              defaultValue={config.evolution_key || ''}
              placeholder="Ej: tu_apikey_secreta"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2463]"
            />
            <p className="text-xs text-gray-400">El token de autenticación (header apikey).</p>
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">Nombre de la Instancia</label>
            <input
              type="text"
              name="evolution_instance"
              defaultValue={config.evolution_instance || ''}
              placeholder="Ej: sinufila-wa"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2463]"
            />
            <p className="text-xs text-gray-400">El nombre exacto de la instancia (número de teléfono) conectado en Evolution API.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0A2463] text-white font-bold rounded-lg hover:bg-[#081b4b] transition-colors shadow-sm"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>

      <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-start gap-4">
        <div className="text-3xl">💡</div>
        <div>
          <h3 className="font-bold text-green-800">¿Cómo funciona?</h3>
          <p className="text-green-700 text-sm mt-1">
            Una vez configurado, el kiosk le preguntará opcionalmente al paciente si desea recibir confirmación vía WhatsApp. 
            El sistema enviará el ticket generado, un aviso cuando sea casi su turno (quede 1 persona), y otra alerta final en cuanto el operador llame su turno.
          </p>
        </div>
      </div>
    </div>
  );
}
