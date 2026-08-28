'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { sendOperatorWelcomeEmail } from '@/lib/email';

// ── Genera una contraseña temporal segura ────────────────────────────────────
// Formato: 3 mayúsculas + 3 números + 2 símbolos → ej: "XKR7@4mP!"
function generateTempPassword(): string {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // sin I, O
  const lower   = 'abcdefghjkmnpqrstuvwxyz';      // sin i, l, o
  const digits  = '23456789';                      // sin 0, 1
  const symbols = '@#$!%&*';

  const pick = (chars: string, n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  const parts = pick(upper, 3) + pick(digits, 3) + pick(lower, 2) + pick(symbols, 1);

  // Mezcla el resultado para que no sea predecible
  return parts.split('').sort(() => Math.random() - 0.5).join('');
}

export async function inviteOperator(formData: FormData) {
  try {
    const entityId = await getCurrentEntityId();
    if (!entityId) return { success: false, error: 'No tienes una entidad asignada.' };

    const email     = (formData.get('email') as string)?.trim().toLowerCase();
    const name      = (formData.get('name') as string)?.trim();
    const window_id = (formData.get('window_id') as string) || null;
    const role      = (formData.get('role') as 'admin' | 'operator') || 'operator';

    if (!email || !name) return { success: false, error: 'Email y nombre son obligatorios.' };

    const adminSupabase = createAdminClient();

    // Obtener nombre de la entidad
    const { data: entity } = await adminSupabase
      .from('entities')
      .select('name')
      .eq('id', entityId)
      .single();

    const institutionName = entity?.name || 'tu institución';

    // ── Generar contraseña temporal ──────────────────────────────────────────
    const tempPassword = generateTempPassword();

    // ── Crear el usuario directamente con email + contraseña ─────────────────
    // createUser bypassa la confirmación de email y el link de invitación.
    // email_confirm: true → cuenta ya activa, no requiere verificación.
    const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password:      tempPassword,
      email_confirm: true,          // cuenta activada de inmediato
      user_metadata: {
        full_name: name,
        entity_id: entityId,
      },
    });

    if (createError || !createData?.user) {
      console.error('Error creando usuario:', createError);
      // Si ya existe, devolver mensaje específico
      if (createError?.message?.includes('already registered')) {
        return { success: false, error: 'Ya existe un usuario con ese correo.' };
      }
      return { success: false, error: createError?.message || 'Error al crear el usuario.' };
    }

    const userId = createData.user.id;

    // ── Crear el operador en la tabla operators ──────────────────────────────
    const { error: insertError } = await adminSupabase.from('operators').insert({
      entity_id: entityId,
      user_id:   userId,
      name,
      window_id,
      role,
      is_active: true,
    });

    if (insertError) {
      console.error('Error insertando operador:', insertError);
      // Rollback: eliminar el usuario de auth si falla el insert
      await adminSupabase.auth.admin.deleteUser(userId);
      return { success: false, error: insertError.message };
    }

    // ── Enviar email de bienvenida con las credenciales ──────────────────────
    try {
      await sendOperatorWelcomeEmail({
        to:              email,
        operatorName:    name,
        institutionName,
        role,
        tempPassword,
        loginUrl:        `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      });
    } catch (emailErr) {
      // No hacemos rollback si el email falla — el usuario ya está creado.
      // Devolvemos un aviso pero con éxito.
      console.error('Error enviando email de bienvenida:', emailErr);
      revalidatePath('/admin/config/operadores');
      return {
        success: true,
        warning: true,
        message: `Operador creado. ⚠️ El email de bienvenida no pudo enviarse. Comparte manualmente: correo=${email}, contraseña temporal=${tempPassword}`,
      };
    }

    revalidatePath('/admin/config/operadores');
    return {
      success: true,
      message: `✅ Operador creado. Se enviaron las credenciales de acceso a ${email}`,
    };

  } catch (err: any) {
    console.error('Exception:', err);
    return { success: false, error: err.message || 'Error inesperado.' };
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
