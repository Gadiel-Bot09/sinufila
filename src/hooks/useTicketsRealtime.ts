'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Calcula el inicio del día en hora Colombia (America/Bogota UTC-5)
 * sin depender de librerías de servidor.
 */
function getStartOfDayColombia(): Date {
  const now = new Date();
  // Obtener la hora actual expresada en timezone Colombia
  const colombiaStr = now.toLocaleString('en-US', { timeZone: 'America/Bogota' });
  const colombiaNow = new Date(colombiaStr);
  // Poner a medianoche en hora Colombia
  colombiaNow.setHours(0, 0, 0, 0);
  // Calcular los offsets para convertir de Colombia a UTC
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
  const utcNow = new Date(utcStr);
  const diffMs = now.getTime() - utcNow.getTime(); // offset Colombia en ms (negativo, UTC-5)
  const colombiaOffset = now.getTime() - colombiaNow.getTime() + diffMs;
  return new Date(colombiaNow.getTime() - (now.getTime() - colombiaNow.getTime() - diffMs));
}

/**
 * Versión simplificada y robusta: toma la fecha local en formato Colombia
 * y construye el inicio del día directamente.
 */
function getStartOfDayColombiaISO(): string {
  // Obtener fecha actual en Colombia como string "YYYY-MM-DD"
  const colombiaDate = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Bogota',
  }); // "2025-03-28"

  // Construir el timestamp de medianoche Colombia como ISO UTC
  // Colombia es UTC-5, entonces medianoche Colombia = 05:00 UTC del mismo día
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
