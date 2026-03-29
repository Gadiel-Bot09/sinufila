'use server';

import { createClient } from '@/lib/supabase/server';
import { getStartOfDayColombia } from '@/lib/timezone';

/**
 * Crea un ticket en modo público (kiosk) o modo autenticado.
 * entityId se recibe directamente — no requiere sesión activa.
 * Los servicios y prioridades se validan contra la entidad para seguridad.
 */
export async function createTicket(entityId: string, serviceId: string, priorityId: string) {
  if (!entityId || !serviceId || !priorityId) {
    return { error: 'Parámetros inválidos' };
  }

  const supabase = createClient();

  // 1. Verificar que el servicio pertenece a la entidad (previene inyección de IDs ajenos)
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, prefix, name')
    .eq('id', serviceId)
    .eq('entity_id', entityId)
    .eq('is_active', true)
    .single();

  if (serviceError || !service) {
    return { error: 'Servicio no válido para esta entidad' };
  }

  // 2. Verificar que la prioridad pertenece a la entidad
  const { data: priority, error: priorityError } = await supabase
    .from('priority_levels')
    .select('id, name, level')
    .eq('id', priorityId)
    .eq('entity_id', entityId)
    .eq('is_active', true)
    .single();

  if (priorityError || !priority) {
    return { error: 'Prioridad no válida para esta entidad' };
  }

  // 3. Calcular número de turno del día (hora Colombia)
  const startOfDayColombia = getStartOfDayColombia();

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('service_id', serviceId)
    .gte('created_at', startOfDayColombia.toISOString());

  const ticketNumber = ((count || 0) + 1).toString().padStart(3, '0');
  const ticketCode = `${service.prefix}-${ticketNumber}`;

  // 4. Insertar el ticket
  const { data: newTicket, error: insertError } = await supabase
    .from('tickets')
    .insert({
      entity_id: entityId,
      service_id: serviceId,
      priority_level_id: priorityId,
      ticket_number: ticketNumber,
      ticket_code: ticketCode,
      status: 'waiting',
    })
    .select(`
      *,
      service:services(name, prefix, color),
      priority:priority_levels(name, level, icon, color)
    `)
    .single();

  if (insertError || !newTicket) {
    console.error('Error insertando ticket:', insertError);
    return { error: 'Error al generar el turno. Intenta nuevamente.' };
  }

  // 5. Posición en la cola (tickets en espera ANTES que este)
  const { count: waitingCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('status', 'waiting')
    .lt('created_at', newTicket.created_at);

  return {
    success: true,
    ticket: newTicket,
    waitingCount: waitingCount || 0,
  };
}
