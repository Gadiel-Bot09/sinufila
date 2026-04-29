-- ============================================================
-- Migration: Kiosk RLS Reforzada
-- SinuFila v1.2 — Valida entidad activa + jornada abierta antes de insertar tickets
-- ============================================================

-- Helper: verifica si una entidad existe y su jornada está abierta
CREATE OR REPLACE FUNCTION public.is_entity_open(p_entity_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entities
    WHERE id = p_entity_id
      -- is_open debe ser true o no estar seteado (default abierta)
      AND (config_json->>'is_open' IS NULL OR config_json->>'is_open' = 'true')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- Reemplaza la política permisiva de INSERT en tickets
-- ============================================================
DROP POLICY IF EXISTS "Kiosk insert tickets" ON public.tickets;

-- Nueva política: solo permite insertar si la entidad existe y está abierta
CREATE POLICY "Kiosk insert tickets validated" ON public.tickets
  FOR INSERT
  WITH CHECK (
    entity_id IS NOT NULL
    AND public.is_entity_open(entity_id)
  );

-- ============================================================
-- También abre el SELECT de entidades al público para que el
-- dispensador y display puedan leer la info sin autenticación
-- ============================================================
DROP POLICY IF EXISTS "Users read their own entity" ON public.entities;

-- Lectura de la propia entidad para usuarios autenticados
CREATE POLICY "Auth users read their entity" ON public.entities
  FOR SELECT
  USING (
    -- Usuario autenticado ve su propia entidad
    id = public.get_current_entity_id()
    OR
    -- Acceso anónimo (kiosk/display público): puede leer cualquier entidad
    auth.role() = 'anon'
  );

-- Asegurar que anónimos puedan leer services, priorities, windows (necesario para kiosk)
DROP POLICY IF EXISTS "Entity members read services" ON public.services;
CREATE POLICY "Entity members read services" ON public.services
  FOR SELECT USING (
    entity_id = public.get_current_entity_id()
    OR auth.role() = 'anon'
  );

DROP POLICY IF EXISTS "Entity members read priorities" ON public.priority_levels;
CREATE POLICY "Entity members read priorities" ON public.priority_levels
  FOR SELECT USING (
    entity_id = public.get_current_entity_id()
    OR auth.role() = 'anon'
  );

DROP POLICY IF EXISTS "Entity members read windows" ON public.windows;
CREATE POLICY "Entity members read windows" ON public.windows
  FOR SELECT USING (
    entity_id = public.get_current_entity_id()
    OR auth.role() = 'anon'
  );

-- Display config también necesita ser accesible para el display TV público
DROP POLICY IF EXISTS "Entity members read display config" ON public.display_config;
CREATE POLICY "Entity members read display config" ON public.display_config
  FOR SELECT USING (
    entity_id = public.get_current_entity_id()
    OR auth.role() = 'anon'
  );

-- tickets: los anónimos del kiosk/display deben poder leer tickets de su entidad
DROP POLICY IF EXISTS "Entity members read tickets" ON public.tickets;
CREATE POLICY "Entity members read tickets" ON public.tickets
  FOR SELECT USING (
    entity_id = public.get_current_entity_id()
    OR auth.role() = 'anon'
  );

-- ============================================================
-- Índice para acelerar is_entity_open
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_entities_config ON public.entities USING gin(config_json);
