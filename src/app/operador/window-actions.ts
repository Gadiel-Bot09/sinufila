'use server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function assignOperatorWindow(operatorId: string, windowId: string) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return { error: 'No autorizado' };

  const supabase = createClient();
  const { error } = await supabase
    .from('operators')
    .update({ window_id: windowId })
    .eq('id', operatorId)
    .eq('entity_id', entityId);

  if (error) return { error: error.message };

  revalidatePath('/operador');
  return { success: true };
}
