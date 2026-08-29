-- ============================================================
-- Migration: Update Trigger for Superadmin
-- SinuFila - Evita crear una institución falsa para el dueño
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_entity_id UUID;
  institution_name TEXT;
BEGIN
  -- Si el usuario es el superadmin dueño de la plataforma, 
  -- NO le creamos una institución ni un operador por defecto.
  IF NEW.email = 'gadielanaya19@gmail.com' THEN
    RETURN NEW;
  END IF;

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
