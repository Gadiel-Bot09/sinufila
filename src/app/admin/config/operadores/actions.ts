'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export async function inviteOperator(formData: FormData) {
  try {
    const entityId = await getCurrentEntityId();
    if (!entityId) return { success: false, error: 'No tienes una entidad asignada.' };

    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const window_id = (formData.get('window_id') as string) || null;
    const role = (formData.get('role') as 'admin' | 'operator') || 'operator';

    // Usar cliente de administrador para tener permisos bypass-RLS y crear el usuario
    const adminSupabase = createAdminClient();

    // Invitar al usuario por email (Supabase enviará el email de confirmación)
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name,
        entity_id: entityId,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (inviteError || !inviteData?.user) {
      console.error('Error invitando desde auth admin:', inviteError);
      return { success: false, error: inviteError?.message || 'Error desconocido al invitar usuario' };
    }

    // Crear el operador en la base de datos
    const { error: insertError } = await adminSupabase.from('operators').insert({
      entity_id: entityId,
      user_id: inviteData.user.id,
      name,
      window_id,
      role,
      is_active: true,
    });

    if (insertError) {
       console.error('Error insertando en la tabla operators:', insertError);
       return { success: false, error: insertError.message };
    }

    // Enviar email de bienvenida con Resend (API route)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/invite-operator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      });
    } catch {
      // Ignorar fallo de envío de resend de bienvenida, la invitación de supabase de igual forma llegó
    }

    revalidatePath('/admin/config/operadores');
    return { success: true, message: '¡Operador invitado con éxito! Se ha enviado un correo a '+email };
  } catch (err: any) {
    console.error('Exception invitando:', err);
    return { success: false, error: err.message || 'Excepción no controlada' };
  }
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
