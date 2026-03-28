import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import { updateTicketConfig } from "./actions";

export default async function TicketsConfigPage() {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div>No tienes una entidad asignada</div>;

  const supabase = createClient();
  const { data: config } = await supabase
    .from("ticket_print_config")
    .select("*")
    .eq("entity_id", entityId)
    .single();

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2463]">Impresión de Tickets</h1>
          <p className="text-gray-500">Ajusta el formato del comprobante que se entrega al cliente.</p>
        </div>
      </div>

      <form action={updateTicketConfig} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formato de Papel</label>
            <select 
              name="paper_size" 
              defaultValue={config?.paper_size || '58mm'} 
              className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]"
            >
              <option value="58mm">Térmica 58mm</option>
              <option value="80mm">Térmica 80mm</option>
              <option value="A4">A4 Estandar</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Elementos a mostrar</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="show_logo" value="true" defaultChecked={config?.show_logo} className="w-4 h-4 text-[#00838F] rounded border-gray-300 focus:ring-[#00838F]" />
              <span className="text-sm text-gray-800">Mostrar Logo de Entidad</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="show_qr" value="true" defaultChecked={config?.show_qr} className="w-4 h-4 text-[#00838F] rounded border-gray-300 focus:ring-[#00838F]" />
              <span className="text-sm text-gray-800">Mostrar Código QR de seguimiento</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de Encabezado</label>
          <input 
            name="header_message" 
            defaultValue={config?.header_message || ''} 
            placeholder="Ej. Clínica La Misericordia"
            className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00838F]" 
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de Pie de Página</label>
           <textarea 
             name="footer_message" 
             rows={2}
             defaultValue={config?.footer_message || ''} 
             placeholder="Ej. ¡Gracias por confiar en nosotros! Por favor evalúe el servicio..."
             className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none" 
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
