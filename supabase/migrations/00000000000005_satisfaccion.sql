-- ============================================================
-- Migration: Tabla de Encuestas de Satisfacción
-- SinuFila v1.3 — Calificaciones post-atención desde /turno
-- ============================================================

CREATE TABLE IF NOT EXISTS public.satisfaction_ratings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id     UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  entity_id     UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Un ticket solo puede tener una calificación
  CONSTRAINT uq_satisfaction_per_ticket UNIQUE (ticket_id)
);

-- RLS
ALTER TABLE public.satisfaction_ratings ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar (paciente anónimo desde /turno)
CREATE POLICY "Public insert satisfaction" ON public.satisfaction_ratings
  FOR INSERT WITH CHECK (entity_id IS NOT NULL);

-- Solo miembros autenticados de la entidad pueden leer
CREATE POLICY "Entity members read satisfaction" ON public.satisfaction_ratings
  FOR SELECT USING (entity_id = public.get_current_entity_id());

-- Índices
CREATE INDEX IF NOT EXISTS idx_satisfaction_entity ON public.satisfaction_ratings(entity_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_ticket ON public.satisfaction_ratings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_created ON public.satisfaction_ratings(created_at DESC);
