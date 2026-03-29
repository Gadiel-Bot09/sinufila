-- SinuFila: agrega número de teléfono al ticket para notificaciones WhatsApp
-- Ejecutar en: Supabase → SQL Editor

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT NULL;

COMMENT ON COLUMN tickets.phone_number IS
  'Número celular opcional del paciente para notificaciones WhatsApp (formato: 573001234567)';

-- Índice para búsqueda por número (útil si se implementa el Modelo 3 de bot)
CREATE INDEX IF NOT EXISTS idx_tickets_phone ON tickets(phone_number)
  WHERE phone_number IS NOT NULL;
