'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { sendWhatsApp, msgTurnoLlamado, msgCasiTuTurno } from '@/lib/whatsapp';

export async function processOperatorAction(
  action: 'attend' | 'complete' | 'skip' | 'absent' | 'recall',
  ticketId?: string
) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return { error: 'No autorizado' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { data: operator } = await supabase
    .from('operators')
    .select('id, window_id, window:windows(name, number)')
    .eq('user_id', user.id)
    .single();

  if (!operator) return { error: 'No eres operador' };

  // Obtener config Evolution API de la entidad
  const { data: entity } = await supabase
    .from('entities')
    .select('name, config_json')
    .eq('id', entityId)
    .single();

  const entityName = entity?.name || 'SinuFila';
  const entityConfig = (entity?.config_json as Record<string, string>) ?? {};
  const evolutionConfig = {
    evolution_url: entityConfig.evolution_url,
    evolution_key: entityConfig.evolution_key,
    evolution_instance: entityConfig.evolution_instance,
  };

  const now = new Date().toISOString();

  // ── ATTEND ────────────────────────────────────────────────────────────────
  if (action === 'attend' && ticketId) {
    const colombiaDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const startOfDay = `${colombiaDate}T05:00:00.000Z`;

    const { data: currentlyAttendingList, error: checkError } = await supabase
      .from('tickets')
      .select('id')
      .eq('operator_id', operator.id)
      .eq('status', 'attending')
      .gte('created_at', startOfDay)
      .limit(1);

    if (currentlyAttendingList && currentlyAttendingList.length > 0) {
      return { error: 'Debes finalizar el turno actual primero o refrescar la página si hay desincronización' };
    }

    if (checkError) {
      console.error('Check Error:', checkError);
      return { error: 'Error del sistema al verificar ticket actual. ' + checkError.message };
    }

    // Fetch ticket data (para WhatsApp)
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, ticket_code, phone_number, service:services(name)')
      .eq('id', ticketId)
      .single();

    const attendResult = await supabase.from('tickets').update({
      status: 'attending',
      operator_id: operator.id,
      window_id: operator.window_id,
      attended_at: now,
      called_at: now,
    }).eq('id', ticketId).eq('status', 'waiting').select('id');

    if (!attendResult.error && attendResult.data && attendResult.data.length > 0) {
      // Enviar WhatsApp "¡Eres llamado!" al paciente
      if (ticket?.phone_number) {
        const windowData = operator.window as unknown as { name: string; number: string } | null;
        await sendWhatsApp(
          ticket.phone_number,
          msgTurnoLlamado({
            entityName,
            ticketCode: ticket.ticket_code,
            windowNumber: windowData?.number,
            windowName: windowData?.name,
          }),
          evolutionConfig
        );
      }

      // 🔔 Notificar al siguiente en la cola "Casi es tu turno"
      await notifyNextInQueue(supabase, entityId, entityName, evolutionConfig);
      return { success: true };
    } else {
      console.error('Attend Error/No Rows:', attendResult);
      return { error: 'Fallo al procesar el llamado. Razón posible: Permisos insuficientes o el turno ya fue llamado.' };
    }
  }

  // ── COMPLETE / SKIP / ABSENT ───────────────────────────────────────────────
  if ((action === 'complete' || action === 'skip' || action === 'absent') && ticketId) {
    const finalStatus = action === 'complete' ? 'completed' : action;

    const { data: ticket } = await supabase
      .from('tickets')
      .select('attended_at')
      .eq('id', ticketId)
      .single();

    let attend_time_seconds = 0;
    if (ticket?.attended_at) {
      attend_time_seconds = Math.floor(
        (new Date().getTime() - new Date(ticket.attended_at).getTime()) / 1000
      );
    }

    const updateResult = await supabase.from('tickets').update({
      status: finalStatus,
      completed_at: now,
      attend_time_seconds,
    }).eq('id', ticketId).eq('operator_id', operator.id).select('id');

    if (!updateResult.error && updateResult.data && updateResult.data.length > 0) {
      // Cuando se completa/salta, notificar al siguiente en cola
      await notifyNextInQueue(supabase, entityId, entityName, evolutionConfig);
      return { success: true };
    } else {
      console.error('Update Ticket Error/No Rows:', updateResult);
      return { error: 'No se pudo actualizar el turno. Es posible que tengas problemas de permisos o sesión expirada.' };
    }
  }

  // ── RECALL ─────────────────────────────────────────────────────────────────
  if (action === 'recall' && ticketId) {
    const { data: ticket } = await supabase
      .from('tickets')
      .select('ticket_code, phone_number')
      .eq('id', ticketId)
      .single();

    const recallResult = await supabase.from('tickets').update({
      called_at: now,
    }).eq('id', ticketId).eq('operator_id', operator.id).select('id');

    if (!recallResult.error && recallResult.data && recallResult.data.length > 0 && ticket?.phone_number) {
      const windowData = operator.window as unknown as { name: string; number: string } | null;
      await sendWhatsApp(
        ticket.phone_number,
        msgTurnoLlamado({
          entityName,
          ticketCode: ticket.ticket_code,
          windowNumber: windowData?.number,
          windowName: windowData?.name,
        }),
        evolutionConfig
      );
    }

    if (!recallResult.error && recallResult.data && recallResult.data.length > 0) {
      return { success: true };
    }
    return { error: 'Fallo al realizar el rellamado (Permisos o turno inexistente)' };
  }

  return { error: 'Acción no válida' };
}

/**
 * Busca el ticket en posición 1 de la cola (el siguiente a ser llamado)
 * que tenga número de teléfono y le envía "casi tu turno".
 */
async function notifyNextInQueue(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createClient>,
  entityId: string,
  entityName: string,
  evolutionConfig: { evolution_url?: string; evolution_key?: string; evolution_instance?: string }
) {
  try {
    // El siguiente es el ticket waiting más antiguo con teléfono
    const { data: nextTickets } = await supabase
      .from('tickets')
      .select('id, ticket_code, phone_number, service:services(name)')
      .eq('entity_id', entityId)
      .eq('status', 'waiting')
      .not('phone_number', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1);

    const next = nextTickets?.[0];
    if (!next?.phone_number) return;

    await sendWhatsApp(
      next.phone_number,
      msgCasiTuTurno({
        entityName,
        ticketCode: next.ticket_code,
        serviceName: (next.service as unknown as { name: string } | null)?.name || '',
      }),
      evolutionConfig
    );
  } catch {
    // No bloquear el flujo si falla el WhatsApp
  }
}
