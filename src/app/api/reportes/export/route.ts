import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentEntityId } from '@/lib/supabase/queries';
import { getStartOfDayColombia, formatTimeColombia } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  const entityId = await getCurrentEntityId();
  if (!entityId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createClient();
  const searchParams = request.nextUrl.searchParams;

  // Fecha desde el query param o usar hoy en Colombia
  const dateParam = searchParams.get('date');
  const startOfDay = dateParam ? new Date(dateParam) : getStartOfDayColombia();

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      ticket_code,
      status,
      created_at,
      attended_at,
      completed_at,
      wait_time_seconds,
      attend_time_seconds,
      service:services(name),
      priority:priority_levels(name, level),
      window:windows(name, number),
      operator:operators(name)
    `)
    .eq('entity_id', entityId)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Estado en español
  const statusLabel: Record<string, string> = {
    waiting: 'En Espera',
    attending: 'En Atención',
    completed: 'Atendido',
    skipped: 'Saltado',
    absent: 'Ausente',
  };

  // Generar CSV
  const headers = [
    'Turno',
    'Estado',
    'Servicio',
    'Prioridad (Nivel)',
    'Ventanilla',
    'Operador',
    'Hora Llegada',
    'Hora Atención',
    'Hora Cierre',
    'Tiempo Espera (min)',
    'Tiempo Atención (min)',
  ];

  const rows = (tickets || []).map(t => [
    t.ticket_code ?? '',
    statusLabel[t.status] ?? t.status ?? '',
    (t.service as any)?.name ?? '',
    `${(t.priority as any)?.name ?? ''} (${(t.priority as any)?.level ?? ''})`,
    t.window ? `V.${(t.window as any).number} - ${(t.window as any).name}` : '',
    (t.operator as any)?.name ?? '',
    t.created_at ? formatTimeColombia(t.created_at) : '',
    t.attended_at ? formatTimeColombia(t.attended_at) : '',
    t.completed_at ? formatTimeColombia(t.completed_at) : '',
    t.wait_time_seconds ? Math.round(t.wait_time_seconds / 60).toString() : '',
    t.attend_time_seconds ? Math.round(t.attend_time_seconds / 60).toString() : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\r\n');

  // BOM UTF-8 para que Excel lo abra correctamente
  const bom = '\uFEFF';
  const dateLabel = startOfDay.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }).replace(/\//g, '-');

  return new NextResponse(bom + csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sinufila-reporte-${dateLabel}.csv"`,
    },
  });
}
