import { createClient } from "./server";

export async function getCurrentEntityId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: operator } = await supabase
    .from('operators')
    .select('entity_id')
    .eq('user_id', user.id)
    .single();

  return operator?.entity_id || null;
}
