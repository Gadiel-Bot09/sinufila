import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, entityId, rating, comment } = body;

    // Validaciones básicas
    if (!ticketId || !entityId || !rating) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating inválido (1-5)' }, { status: 400 });
    }

    const supabase = createClient();

    // Verificar que el ticket existe y pertenece a la entidad, y está completado
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, status, entity_id')
      .eq('id', ticketId)
      .eq('entity_id', entityId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
    }

    if (ticket.status !== 'completed') {
      return NextResponse.json({ error: 'Solo se puede calificar turnos completados' }, { status: 400 });
    }

    // Insertar (ignorar si ya existe — el constraint UNIQUE lo maneja)
    const { error: insertError } = await supabase
      .from('satisfaction_ratings')
      .upsert(
        {
          ticket_id:  ticketId,
          entity_id:  entityId,
          rating:     Math.round(rating),
          comment:    comment?.slice(0, 200) || null,
        },
        { onConflict: 'ticket_id', ignoreDuplicates: false }
      );

    if (insertError) {
      console.error('[Satisfaccion] Error insertando rating:', insertError.message);
      // No devolvemos error al cliente para no bloquear la UX
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Satisfaccion] Error inesperado:', err);
    return NextResponse.json({ ok: true }); // silencioso hacia el cliente
  }
}
