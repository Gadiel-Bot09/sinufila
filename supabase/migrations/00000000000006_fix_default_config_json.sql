-- ============================================================
-- Migration: Fix Default config_json on Entity Creation
-- SinuFila v1.3 — Garantiza que config_json tenga valores por defecto
-- ============================================================

-- Problema: El trigger handle_new_user creaba entidades con config_json = '{}'
-- lo que dejaba el campo "Horario de Atención" sin valor en el módulo de ajustes.
-- El demo-seed sí incluía { hours: '08:00 - 18:00' }, pero el registro normal no.

-- ────────────────────────────────────────────────────────────
-- 1. Corregir el trigger para que incluya config_json por defecto
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_entity_id UUID;
  institution_name TEXT;
BEGIN
  -- Si el usuario viene de una invitación (tiene entity_id en metadata), no crear una nueva entidad
  IF (NEW.raw_user_meta_data->>'entity_id') IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Leer el nombre de institución desde los metadatos del usuario (Registro normal)
  institution_name := COALESCE(
    NEW.raw_user_meta_data->>'institution_name',
    'Mi Institución'
  );

  -- Crear la entidad con config_json por defecto (incluye horario)
  INSERT INTO public.entities (name, config_json)
  VALUES (
    institution_name,
    jsonb_build_object(
      'hours',   'Lunes a Viernes 08:00 - 18:00',
      'is_open', true
    )
  )
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

-- ────────────────────────────────────────────────────────────
-- 2. Backfill: Reparar las entidades que quedaron con config_json
--    sin la clave 'hours' (las creadas por registro normal previo)
--    Solo actualiza si 'hours' no existe aún en config_json.
-- ────────────────────────────────────────────────────────────
UPDATE public.entities
SET config_json = config_json || jsonb_build_object('hours', 'Lunes a Viernes 08:00 - 18:00')
WHERE config_json->>'hours' IS NULL;
