import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/patients/lookup?entity=UUID&doc=NUMERO
 *
 * Búsqueda pública (kiosk/anon) — solo devuelve nombre y teléfono,
 * nunca expone el UUID interno del paciente.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get('entity');
  const doc      = searchParams.get('doc')?.trim();

  if (!entityId || !doc) {
    return NextResponse.json({ found: false, error: 'Parámetros requeridos: entity, doc' }, { status: 400 });
  }

  // Sanitización básica: solo dígitos
  const cleanDoc = doc.replace(/\D/g, '');
  if (!cleanDoc || cleanDoc.length < 4) {
    return NextResponse.json({ found: false, error: 'Número de documento inválido' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: patient, error } = await supabase
    .from('patients')
    .select('full_name, phone_number')
    .eq('entity_id', entityId)
    .eq('document_number', cleanDoc)
    .single();

  if (error || !patient) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    patient: {
      full_name:    patient.full_name,
      phone_number: patient.phone_number ?? null,
    },
  });
}
