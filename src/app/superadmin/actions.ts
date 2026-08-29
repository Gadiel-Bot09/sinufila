'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const SUPERADMIN_EMAILS = ['gadielanaya19@gmail.com'];

export async function toggleEntityStatus(entityId: string, currentState: boolean) {
  try {
    // 1. Verify superadmin auth
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !SUPERADMIN_EMAILS.includes(user.email || '')) {
      throw new Error('Unauthorized');
    }

    // 2. We use admin client to bypass RLS and update
    const adminSupabase = createAdminClient();

    // Fetch current config
    const { data: entity } = await adminSupabase
      .from('entities')
      .select('config_json')
      .eq('id', entityId)
      .single();

    if (!entity) return false;

    const currentConfig = entity.config_json || {};
    const newConfig = {
      ...currentConfig,
      is_active: !currentState // Toggle state
    };

    const { error } = await adminSupabase
      .from('entities')
      .update({ config_json: newConfig })
      .eq('id', entityId);

    if (error) {
      console.error('Error updating entity status:', error);
      return false;
    }

    revalidatePath('/superadmin');
    return true;
  } catch (error) {
    console.error('toggleEntityStatus error:', error);
    return false;
  }
}
