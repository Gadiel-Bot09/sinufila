'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

/**
 * Abre o cierra la jornada del día para la entidad actual.
 * Guarda `is_open: boolean` dentro de config_json de la entidad.
 */
export async function toggleJornada(isOpen: boolean) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return { error: 'No autorizado' };

  const supabase = createClient();

  // 1. Obtener config_json actual para no pisar los demás campos
  const { data: entity } = await supabase
    .from('entities')
    .select('config_json')
    .eq('id', entityId)
    .single();

  const currentConfig = (entity?.config_json as Record<string, unknown>) ?? {};
  const newConfig = { ...currentConfig, is_open: isOpen };

  // 2. Actualizar
  const { error } = await supabase
    .from('entities')
    .update({ config_json: newConfig })
    .eq('id', entityId);

  if (error) return { error: error.message };

  revalidatePath('/admin/dashboard');
  revalidatePath('/dispensador');
  return { success: true, is_open: isOpen };
}
