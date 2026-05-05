'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function updateDisplayConfig(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return { error: 'No tienes una entidad asignada.' };

  // video_url viene del campo hidden que el client component sincroniza con el estado
  const video_url   = (formData.get('video_url')   as string)?.trim() || null;
  const ticker_text = (formData.get('ticker_text') as string)?.trim() || null;

  const supabase = createClient();

  // upsert: crea el registro si no existe, o actualiza si ya existe
  const { error } = await supabase
    .from('display_config')
    .upsert(
      {
        entity_id:  entityId,
        video_url,
        ticker_text,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'entity_id' }
    );

  if (error) {
    console.error('[DisplayConfig] Error guardando:', error.message);
    return { error: 'Error al guardar la configuración. Intenta de nuevo.' };
  }

  revalidatePath('/admin/config/display');
  return { success: true };
}
