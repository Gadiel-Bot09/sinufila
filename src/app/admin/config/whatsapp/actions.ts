'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function updateWhatsAppConfig(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const evolution_url = formData.get('evolution_url') as string;
  const evolution_key = formData.get('evolution_key') as string;
  const evolution_instance = formData.get('evolution_instance') as string;

  const supabase = createClient();

  // 1. Obtener config actual
  const { data: entity } = await supabase
    .from('entities')
    .select('config_json')
    .eq('id', entityId)
    .single();

  const currentConfig = (entity?.config_json as Record<string, unknown>) ?? {};
  
  // 2. Hacer merge con la configuración de whatsapp actual
  const newConfig = {
    ...currentConfig,
    evolution_url,
    evolution_key,
    evolution_instance,
  };

  const result = await supabase
    .from('entities')
    .update({
      config_json: newConfig,
    })
    .eq('id', entityId);

  if (result.error) {
    console.error(result.error);
    return;
  }

  revalidatePath('/admin/config/whatsapp');
}
