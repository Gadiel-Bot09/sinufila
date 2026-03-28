'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';

export async function createTicket(serviceId: string, priorityId: string) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return { error: 'No autorizado' };

  const supabase = createClient();

  // 1. Get service prefix
  const { data: service } = await supabase.from('services').select('prefix').eq('id', serviceId).single();
  if (!service) return { error: 'Servicio no encontrado' };

  // 2. Calculate next ticket number for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('service_id', serviceId)
    .gte('created_at', today.toISOString());

  const rootNumber = (count || 0) + 1;
  const ticket_number = rootNumber.toString().padStart(3, '0');
  const ticket_code = `${service.prefix}-${ticket_number}`;

  // 3. Insert Ticket
  const { data: newTicket, error } = await supabase.from('tickets').insert({
    entity_id: entityId,
    service_id: serviceId,
    priority_level_id: priorityId,
    ticket_number,
    ticket_code,
    status: 'waiting',
  }).select(`
    *,
    service:services (name),
    priority:priority_levels (name)
  `).single();

  if (error || !newTicket) {
    console.error(error);
    return { error: 'Error generando el turno' };
  }

  // Find wait position
  const { count: waitingCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', entityId)
    .eq('status', 'waiting')
    .lt('created_at', newTicket.created_at);

  return { success: true, ticket: newTicket, waitingCount: waitingCount || 0 };
}
