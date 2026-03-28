-- ============================================================
-- Migration: Trigger + RLS Granular + Role + Ventanillas Setup
-- SinuFila v1.1 — Zona Horaria Colombia (UTC-5)
-- ============================================================

-- 1. Añadir columna role a operators
ALTER TABLE public.operators 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'operator' 
  CHECK (role IN ('admin', 'operator'));

-- 2. Añadir columna updated_at a entities
ALTER TABLE public.entities 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- TRIGGER: Al crear un usuario en Supabase Auth,
--          auto-crear la entidad y el operator-admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_entity_id UUID;
  institution_name TEXT;
BEGIN
  -- Leer el nombre de institución desde los metadatos del usuario
  institution_name := COALESCE(
    NEW.raw_user_meta_data->>'institution_name',
    'Mi Institución'
  );

  -- Crear la entidad
  INSERT INTO public.entities (name, config_json)
  VALUES (institution_name, '{}'::jsonb)
  RETURNING id INTO new_entity_id;

  -- Crear el operador-admin vinculado al usuario
  INSERT INTO public.operators (entity_id, user_id, name, role, is_active)
  VALUES (
    new_entity_id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin',
    TRUE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vincula el trigger al evento de inserción en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER: Función que retorna el entity_id del usuario actual
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_entity_id()
RETURNS UUID AS $$
  SELECT entity_id FROM public.operators
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- RLS GRANULAR — Reemplaza las políticas permisivas
-- ============================================================

-- Entities
DROP POLICY IF EXISTS "Public read entities" ON public.entities;
CREATE POLICY "Users read their own entity" ON public.entities
  FOR SELECT USING (id = public.get_current_entity_id());

CREATE POLICY "Admins update their own entity" ON public.entities
  FOR UPDATE USING (id = public.get_current_entity_id());

-- Services
DROP POLICY IF EXISTS "Users can read own entity services" ON public.services;
CREATE POLICY "Entity members read services" ON public.services
  FOR SELECT USING (entity_id = public.get_current_entity_id() OR entity_id IS NOT NULL);

CREATE POLICY "Admins manage services" ON public.services
  FOR ALL USING (entity_id = public.get_current_entity_id());

-- Priority Levels
DROP POLICY IF EXISTS "Users can read own entity priorities" ON public.priority_levels;
CREATE POLICY "Entity members read priorities" ON public.priority_levels
  FOR SELECT USING (true);

CREATE POLICY "Admins manage priorities" ON public.priority_levels
  FOR ALL USING (entity_id = public.get_current_entity_id());

-- Windows
DROP POLICY IF EXISTS "Users can read own entity windows" ON public.windows;
CREATE POLICY "Entity members read windows" ON public.windows
  FOR SELECT USING (true);

CREATE POLICY "Admins manage windows" ON public.windows
  FOR ALL USING (entity_id = public.get_current_entity_id());

-- Operators
CREATE POLICY "Entity members read operators" ON public.operators
  FOR SELECT USING (entity_id = public.get_current_entity_id());

CREATE POLICY "Admins manage operators" ON public.operators
  FOR ALL USING (entity_id = public.get_current_entity_id());

-- Tickets: políticas granulares por entity_id
DROP POLICY IF EXISTS "Public can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public can read tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public can update tickets" ON public.tickets;

CREATE POLICY "Kiosk insert tickets" ON public.tickets
  FOR INSERT WITH CHECK (entity_id IS NOT NULL);

CREATE POLICY "Entity members read tickets" ON public.tickets
  FOR SELECT USING (entity_id = public.get_current_entity_id());

CREATE POLICY "Operators update own entity tickets" ON public.tickets
  FOR UPDATE USING (entity_id = public.get_current_entity_id());

-- Display config
CREATE POLICY "Entity members read display config" ON public.display_config
  FOR SELECT USING (entity_id = public.get_current_entity_id());

CREATE POLICY "Admins manage display config" ON public.display_config
  FOR ALL USING (entity_id = public.get_current_entity_id());

-- Ticket print config
CREATE POLICY "Entity members read print config" ON public.ticket_print_config
  FOR SELECT USING (entity_id = public.get_current_entity_id());

CREATE POLICY "Admins manage print config" ON public.ticket_print_config
  FOR ALL USING (entity_id = public.get_current_entity_id());

-- ============================================================
-- ÍNDICES para mejorar performance de queries frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tickets_entity_status ON public.tickets(entity_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_entity_created ON public.tickets(entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operators_user_id ON public.operators(user_id);
CREATE INDEX IF NOT EXISTS idx_operators_entity_id ON public.operators(entity_id);
