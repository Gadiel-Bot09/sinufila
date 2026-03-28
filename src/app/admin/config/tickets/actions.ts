'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function updateTicketConfig(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const paper_size = formData.get('paper_size') as string;
  const show_logo = formData.get('show_logo') === 'true';
  const show_qr = formData.get('show_qr') === 'true';
  const header_message = formData.get('header_message') as string;
  const footer_message = formData.get('footer_message') as string;

  const supabase = createClient();
  await supabase
    .from('ticket_print_config')
    .update({
      paper_size,
      show_logo,
      show_qr,
      header_message,
      footer_message,
      updated_at: new Date().toISOString(),
    })
    .eq('entity_id', entityId);

  revalidatePath('/admin/config/tickets');
}
