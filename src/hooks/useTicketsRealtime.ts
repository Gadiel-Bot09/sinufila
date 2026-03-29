'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';


/**
 * Inicio del día en hora Colombia (UTC-5).
 * medianoche Colombia = 05:00 UTC del mismo día.
 */
function getStartOfDayColombiaISO(): string {
  const colombiaDate = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Bogota',
  });
  return `${colombiaDate}T05:00:00.000Z`;
}


export function useTicketsRealtime(entityId: string) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!entityId) return;
    const supabase = supabaseRef.current;

    // Inicio del día en Colombia (UTC-5) — no usa UTC del servidor
    const startOfDay = getStartOfDayColombiaISO();

    const SELECT_QUERY = `
      *,
      service:services(name, color, prefix),
      priority:priority_levels(name, level, color, icon),
      window:windows(name, number)
    `;

    const fetchInitial = async () => {
      const { data } = await supabase
        .from('tickets')
        .select(SELECT_QUERY)
        .eq('entity_id', entityId)
        .gte('created_at', startOfDay)
        .order('created_at', { ascending: true });

      if (data) setTickets(data);
      setLoading(false);
    };

    fetchInitial();

    // Fetch un ticket con todas sus relaciones (para updates del realtime)
    const fetchRelated = async (ticketId: string) => {
      const { data } = await supabase
        .from('tickets')
        .select(SELECT_QUERY)
        .eq('id', ticketId)
        .single();
      return data;
    };

    const channel = supabase
      .channel(`tickets-realtime-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `entity_id=eq.${entityId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const data = await fetchRelated((payload.new as any).id);
            if (data) setTickets((prev) => [...prev, data]);
          } else if (payload.eventType === 'UPDATE') {
            const data = await fetchRelated((payload.new as any).id);
            if (data) {
              setTickets((prev) =>
                prev.map((t) => (t.id === (payload.new as any).id ? data : t))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) =>
              prev.filter((t) => t.id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId]);

  return { tickets, loading };
}
