-- ============================================================
-- SinuFila Migration 007 — Módulo de Pacientes
-- Crea tabla patients + columna patient_name en tickets
-- ============================================================

-- ── Tabla: patients ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patients (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id       UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  document_number TEXT NOT NULL,
  phone_number    TEXT DEFAULT NULL,  -- opcional, para prellenar WhatsApp
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_patient_doc_entity UNIQUE (entity_id, document_number)
);

COMMENT ON TABLE public.patients IS
  'Directorio de pacientes/usuarios por entidad. Permite identificarlos en el dispensador por número de documento.';
COMMENT ON COLUMN public.patients.document_number IS
  'Número de documento (cédula, pasaporte, etc.) — único por entidad.';
COMMENT ON COLUMN public.patients.phone_number IS
  'Teléfono opcional (formato 573001234567) para prellenar WhatsApp en el dispensador.';

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_entity_doc
  ON public.patients(entity_id, document_number);

CREATE INDEX IF NOT EXISTS idx_patients_entity_name
  ON public.patients(entity_id, lower(full_name));

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Admins/operadores de la entidad pueden hacer CRUD
CREATE POLICY "Entity members manage patients" ON public.patients
  USING (entity_id = public.get_current_entity_id())
  WITH CHECK (entity_id = public.get_current_entity_id());

-- El kiosk (anon) puede hacer SELECT para el lookup por documento
CREATE POLICY "Kiosk lookup patients" ON public.patients
  FOR SELECT USING (true);

-- ── Columna patient_name en tickets ──────────────────────────
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS patient_name TEXT DEFAULT NULL;

COMMENT ON COLUMN public.tickets.patient_name IS
  'Nombre del paciente si fue identificado por Nº de documento al tomar el turno en el kiosk.';

-- Índice para búsqueda por nombre en reportes
CREATE INDEX IF NOT EXISTS idx_tickets_patient_name
  ON public.tickets(entity_id, patient_name)
  WHERE patient_name IS NOT NULL;
