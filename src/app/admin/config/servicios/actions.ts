'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function addService(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const name = formData.get('name') as string;
  const prefix = formData.get('prefix') as string;
  const color = formData.get('color') as string;
  const avg_time_minutes = parseInt(formData.get('avg_time_minutes') as string, 10);

  const supabase = createClient();
  const result = await supabase.from('services').insert({
    entity_id: entityId,
    name,
    prefix,
    color,
    avg_time_minutes,
    is_active: true,
  });

  if (result.error) {
    console.error(result.error);
  }

  revalidatePath('/admin/config/servicios');
}

export async function toggleServiceActive(serviceId: string, currentState: boolean) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const supabase = createClient();
  await supabase
    .from('services')
    .update({ is_active: !currentState })
    .eq('id', serviceId)
    .eq('entity_id', entityId);
  revalidatePath('/admin/config/servicios');
}

export async function deleteService(serviceId: string) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const supabase = createClient();
  await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)
    .eq('entity_id', entityId);
  revalidatePath('/admin/config/servicios');
}
