-- ============================================================
-- Migration: Fix Registration Trigger for Invites
-- ============================================================

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
