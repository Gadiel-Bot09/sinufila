'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function updateDisplayConfig(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const video_url = formData.get('video_url') as string;
  const ticker_text = formData.get('ticker_text') as string;

  const supabase = createClient();
  await supabase
    .from('display_config')
    .update({
      video_url,
      ticker_text,
      updated_at: new Date().toISOString(),
    })
    .eq('entity_id', entityId);

  revalidatePath('/admin/config/display');
}
