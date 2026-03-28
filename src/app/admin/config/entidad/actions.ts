'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function updateEntity(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const name = formData.get('name') as string;
  const logo_url = formData.get('logo_url') as string;
  const hours = formData.get('hours') as string;

  const supabase = createClient();

  const result = await supabase
    .from('entities')
    .update({
      name,
      logo_url,
      config_json: { hours },
    })
    .eq('id', entityId);

  if (result.error) {
    console.error(result.error);
    return;
  }

  revalidatePath('/admin/config/entidad');
}
