'use server';

import { createClient } from '@/lib/supabase/server';
import { getStartOfDayColombia } from '@/lib/timezone';
import { sendWhatsApp, msgTicketConfirmacion, normalizePhoneCO } from '@/lib/whatsapp';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinufila.sinuhub.com';

export async function createTicket(
  entityId: string,
  serviceId: string,
  priorityId: string,
  phoneNumber?: string | null
) {
  if (!entityId || !serviceId || !priorityId) {
    return { error: 'Parámetros inválidos' };
  }

  const supabase = createClient();

  // 1. Verificar servicio pertenece a la entidad
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

  // 2. Verificar prioridad
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

  // 3. Número de turno del día (hora Colombia)
  const startOfDayColombia = getStartOfDayColombia();

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('service_id', serviceId)
    .gte('created_at', startOfDayColombia.toISOString());

  const ticketNumber = ((count || 0) + 1).toString().padStart(3, '0');
  const ticketCode = `${service.prefix}-${ticketNumber}`;

  // 4. Normalizar teléfono (si existe)
  const normalizedPhone = phoneNumber ? normalizePhoneCO(phoneNumber) : null;

  // 5. Insertar ticket
  const { data: newTicket, error: insertError } = await supabase
    .from('tickets')
    .insert({
      entity_id: entityId,
      service_id: serviceId,
      priority_level_id: priorityId,
      ticket_number: ticketNumber,
      ticket_code: ticketCode,
      status: 'waiting',
      phone_number: normalizedPhone || null,
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

  // 6. Posición en cola
  const { count: waitingCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('status', 'waiting')
    .lt('created_at', newTicket.created_at);

  // 7. Obtener nombre de la entidad y config de Evolution API
  const { data: entity } = await supabase
    .from('entities')
    .select('name, config_json')
    .eq('id', entityId)
    .single();

  const entityName = entity?.name || 'SinuFila';
  const entityConfig = (entity?.config_json as Record<string, string>) ?? {};

  // 8. Enviar WhatsApp de confirmación (si hay número)
  let whatsappSent = false;
  if (normalizedPhone) {
    const trackingUrl = `${SITE_URL}/turno?entity=${entityId}&id=${newTicket.id}`;
    const message = msgTicketConfirmacion({
      entityName,
      ticketCode,
      serviceName: service.name,
      priorityName: priority.name,
      waitingBefore: waitingCount || 0,
      trackingUrl,
    });

    const waResult = await sendWhatsApp(normalizedPhone, message, {
      evolution_url: entityConfig.evolution_url,
      evolution_key: entityConfig.evolution_key,
      evolution_instance: entityConfig.evolution_instance,
    });

    whatsappSent = waResult.ok;
  }

  return {
    success: true,
    ticket: newTicket,
    waitingCount: waitingCount || 0,
    whatsappSent,
  };
}
