'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export interface VoiceSettingsPayload {
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  repetitions?: number;
  repeatIntervalMs?: number;
  template?: string;
}

export async function saveVoiceSettings(settings: VoiceSettingsPayload) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const supabase = createClient();
  await supabase
    .from('display_config')
    .update({ voice_settings_json: settings, updated_at: new Date().toISOString() })
    .eq('entity_id', entityId);

  revalidatePath('/admin/config/voz');
}
