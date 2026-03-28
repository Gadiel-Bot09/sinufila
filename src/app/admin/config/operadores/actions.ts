'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function inviteOperator(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const window_id = (formData.get('window_id') as string) || null;
  const role = (formData.get('role') as 'admin' | 'operator') || 'operator';

  const supabase = createClient();

  // Invitar al usuario por email (Supabase enviará el email de confirmación)
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: name,
      entity_id: entityId,
    },
  });

  if (inviteError || !inviteData?.user) {
    console.error('Error invitando:', inviteError);
    return;
  }

  // Crear el operador manualmente (el trigger sólo crea admin, operadores se crean aquí)
  await supabase.from('operators').insert({
    entity_id: entityId,
    user_id: inviteData.user.id,
    name,
    window_id: window_id || null,
    role,
    is_active: true,
  });

  // Enviar email de bienvenida con Resend (se llama al API route)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/invite-operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role }),
    });
  } catch (_err) {
    // No bloquear si falla el email
  }

  revalidatePath('/admin/config/operadores');
}

export async function updateOperatorWindow(operatorId: string, formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const windowId = (formData.get('windowId') as string) || null;

  const supabase = createClient();
  await supabase
    .from('operators')
    .update({ window_id: windowId })
    .eq('id', operatorId)
    .eq('entity_id', entityId);

  revalidatePath('/admin/config/operadores');
}

export async function toggleOperatorActive(operatorId: string, currentState: boolean) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return;

  const supabase = createClient();
  await supabase
    .from('operators')
    .update({ is_active: !currentState })
    .eq('id', operatorId)
    .eq('entity_id', entityId);

  revalidatePath('/admin/config/operadores');
}
