'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function addWindow(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const name = formData.get('name') as string;
  const number = formData.get('number') as string;

  const supabase = createClient();
  await supabase.from('windows').insert({
    entity_id: entityId,
    name,
    number,
    is_active: true,
  });

  revalidatePath('/admin/config/ventanillas');
}

export async function toggleWindowActive(windowId: string, currentState: boolean) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const supabase = createClient();
  await supabase
    .from('windows')
    .update({ is_active: !currentState })
    .eq('id', windowId)
    .eq('entity_id', entityId);

  revalidatePath('/admin/config/ventanillas');
}

export async function deleteWindow(windowId: string) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const supabase = createClient();
  await supabase
    .from('windows')
    .delete()
    .eq('id', windowId)
    .eq('entity_id', entityId);

  revalidatePath('/admin/config/ventanillas');
}
