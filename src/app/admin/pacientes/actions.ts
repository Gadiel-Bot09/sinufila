'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

const PAGE_SIZE = 25;

/** Lista de pacientes con búsqueda y paginación */
export async function getPatients(search = '', page = 1) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return { patients: [], total: 0, error: 'No autenticado' };

  const supabase = createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .eq('entity_id', entityId)
    .order('full_name', { ascending: true })
    .range(from, to);

  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(`full_name.ilike.${q},document_number.ilike.${q}`);
  }

  const { data, count, error } = await query;

  if (error) return { patients: [], total: 0, error: error.message };
  return { patients: data ?? [], total: count ?? 0 };
}

/** Crear o actualizar paciente (upsert por document_number + entity_id) */
export async function upsertPatient(formData: FormData) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return { error: 'No autenticado' };

  const patientId     = formData.get('id') as string | null;
  const full_name     = (formData.get('full_name') as string)?.trim();
  const document_number = (formData.get('document_number') as string)?.replace(/\D/g, '').trim();
  const phone_number  = (formData.get('phone_number') as string)?.replace(/\D/g, '').trim() || null;

  if (!full_name || full_name.length < 2)
    return { error: 'El nombre completo es obligatorio (mínimo 2 caracteres).' };
  if (!document_number || document_number.length < 4)
    return { error: 'El número de documento es obligatorio (mínimo 4 dígitos).' };

  const supabase = createClient();

  if (patientId) {
    // Actualizar
    const { error } = await supabase
      .from('patients')
      .update({
        full_name,
        document_number,
        phone_number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patientId)
      .eq('entity_id', entityId);

    if (error) return { error: error.message };
  } else {
    // Crear (upsert para evitar duplicados por documento)
    const { error } = await supabase
      .from('patients')
      .upsert(
        { entity_id: entityId, full_name, document_number, phone_number },
        { onConflict: 'entity_id,document_number' }
      );

    if (error) return { error: error.message };
  }

  revalidatePath('/admin/pacientes');
  return { success: true };
}

/** Eliminar paciente por ID */
export async function deletePatient(patientId: string) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return { error: 'No autenticado' };

  const supabase = createClient();

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId)
    .eq('entity_id', entityId);

  if (error) return { error: error.message };

  revalidatePath('/admin/pacientes');
  return { success: true };
}
