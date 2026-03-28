'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function addPriority(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const name = formData.get('name') as string;
  const level = parseInt(formData.get('level') as string, 10);
  const color = formData.get('color') as string;
  const icon = formData.get('icon') as string;
  const description = formData.get('description') as string;

  const supabase = createClient();
  await supabase.from('priority_levels').insert({
    entity_id: entityId,
    name,
    level,
    color,
    icon,
    description,
    is_active: true,
  });

  revalidatePath('/admin/config/prioridades');
}

export async function togglePriorityActive(priorityId: string, currentState: boolean) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const supabase = createClient();
  await supabase
    .from('priority_levels')
    .update({ is_active: !currentState })
    .eq('id', priorityId)
    .eq('entity_id', entityId);
  revalidatePath('/admin/config/prioridades');
}

export async function deletePriority(priorityId: string) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const supabase = createClient();
  await supabase
    .from('priority_levels')
    .delete()
    .eq('id', priorityId)
    .eq('entity_id', entityId);
  revalidatePath('/admin/config/prioridades');
}
