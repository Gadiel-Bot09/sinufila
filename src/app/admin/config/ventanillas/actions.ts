'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function addWindow(formData: FormData) {
  try {
    const entityId = await getCurrentEntityId();
    if (!entityId) return;

    const name = formData.get('name') as string;
    const number = formData.get('number') as string;

    const supabase = createClient();
    const { error } = await supabase.from('windows').insert({
      entity_id: entityId,
      name,
      number,
      is_active: true,
    });

    if (error) {
      console.error('Supabase error inserting window:', error);
      return;
    }

    revalidatePath('/admin/config/ventanillas');
  } catch (err: any) {
    console.error('Exception in addWindow:', err);
  }
}

export async function toggleWindowActive(windowId: string, currentState: boolean) {
  try {
    const entityId = await getCurrentEntityId();
    if (!entityId) return;

    const supabase = createClient();
    await supabase
      .from('windows')
      .update({ is_active: !currentState })
      .eq('id', windowId)
      .eq('entity_id', entityId);

    revalidatePath('/admin/config/ventanillas');
  } catch (err) {
    console.error('Exception in toggleWindowActive:', err);
  }
}

export async function deleteWindow(windowId: string) {
  try {
    const entityId = await getCurrentEntityId();
    if (!entityId) return;

    const supabase = createClient();
    await supabase
      .from('windows')
      .delete()
      .eq('id', windowId)
      .eq('entity_id', entityId);

    revalidatePath('/admin/config/ventanillas');
  } catch (err) {
    console.error('Exception in deleteWindow:', err);
  }
}
