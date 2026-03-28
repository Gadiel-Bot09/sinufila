'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTicketsRealtime(entityId: string) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Keep one stable client reference for the hook's lifetime
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!entityId) return;
    const supabase = supabaseRef.current;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fetchInitial = async () => {
      const { data } = await supabase
        .from('tickets')
        .select(`
          *,
          service:services(name, color, prefix),
          priority:priority_levels(name, level, color, icon)
        `)
        .eq('entity_id', entityId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      if (data) setTickets(data);
      setLoading(false);
    };

    fetchInitial();

    const fetchRelated = async (ticketId: string) => {
      const { data } = await supabase
        .from('tickets')
        .select(`
          *,
          service:services(name, color, prefix),
          priority:priority_levels(name, level, color, icon)
        `)
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
            setTickets((prev) => prev.filter((t) => t.id !== (payload.old as any).id));
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
