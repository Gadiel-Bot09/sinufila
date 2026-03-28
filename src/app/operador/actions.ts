'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';

export async function processOperatorAction(action: 'attend' | 'complete' | 'skip' | 'absent' | 'recall', ticketId?: string) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return { error: 'No autorizado' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  // Fetch operator id
  const { data: operator } = await supabase.from('operators').select('id, window_id').eq('user_id', user.id).single();
  if (!operator) return { error: 'No eres operador' };

  const now = new Date().toISOString();

  if (action === 'attend' && ticketId) {
    // Check if operator already has an attending ticket
    const { data: currentlyAttending } = await supabase
      .from('tickets')
      .select('id')
      .eq('operator_id', operator.id)
      .eq('status', 'attending')
      .single();
    
    if (currentlyAttending) {
      // Must finish current ticket first
      return { error: 'Debes finalizar el turno actual primero' };
    }

    // Attempt to lock/update the ticket to attending
    const attendResult = await supabase.from('tickets').update({
      status: 'attending',
      operator_id: operator.id,
      window_id: operator.window_id,
      attended_at: now,
      called_at: now // Call it again to show on display!
    }).eq('id', ticketId).eq('status', 'waiting');

    return { success: !attendResult.error };
  }

  if ((action === 'complete' || action === 'skip' || action === 'absent') && ticketId) {
    let finalStatus = action === 'complete' ? 'completed' : action;
    
    // Calculate attend time
    const { data: ticket } = await supabase.from('tickets').select('attended_at').eq('id', ticketId).single();
    let attend_time_seconds = 0;
    if (ticket?.attended_at) {
      attend_time_seconds = Math.floor((new Date().getTime() - new Date(ticket.attended_at).getTime()) / 1000);
    }

    const updateResult = await supabase.from('tickets').update({
      status: finalStatus,
      completed_at: now,
      attend_time_seconds
    }).eq('id', ticketId).eq('operator_id', operator.id);

    return { success: !updateResult.error };
  }

  if (action === 'recall' && ticketId) {
    // Just update the called_at timestamp to trigger the realtime display event
    const recallResult = await supabase.from('tickets').update({
      called_at: now
    }).eq('id', ticketId).eq('operator_id', operator.id);
    
    return { success: !recallResult.error };
  }

  return { error: 'Acción no válida' };
}
