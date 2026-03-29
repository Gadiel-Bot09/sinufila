import { createClient } from "@/lib/supabase/server";
import { getCurrentEntityId } from "@/lib/supabase/queries";
import ReportesClient from "./ReportesClient";

interface Props {
  searchParams: { date?: string };
}

export default async function ReportesPage({ searchParams }: Props) {
  const entityId = await getCurrentEntityId();
  if (!entityId) return <div className="p-8 text-red-600">No tienes una entidad asignada.</div>;

  const supabase = createClient();


  // Calcular inicio del día seleccionado en UTC conservando hora Colombia (UTC-5 = offset +5h)
  let startISO: string;
  let endISO: string;
  try {
    // dateParam llega como "YYYY-MM-DD" en hora Colombia
    const dateParts = searchParams?.date?.split('-');
    if (dateParts && dateParts.length === 3) {
      startISO = `${searchParams.date}T05:00:00.000Z`; // medianoche Colombia = 05:00 UTC
      endISO = `${searchParams.date}T28:59:59.999Z`;   // fin día siguiente UTC
    } else {
      throw new Error('use today');
    }
  } catch {
    // Hoy en Colombia
    const colombiaDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    startISO = `${colombiaDate}T05:00:00.000Z`;
    endISO = new Date().toISOString();
  }

  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      *,
      priority:priority_levels(name, level, color),
      service:services(name, color),
      window:windows(name, number),
      operator:operators(name)
    `)
    .eq('entity_id', entityId)
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .order('created_at', { ascending: true });

  // Últimos 30 días para el selector de fecha
  const last30Days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last30Days.push(d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }));
  }

  return (
    <ReportesClient
      tickets={tickets || []}
      entityId={entityId}
      availableDates={last30Days}
      selectedDate={searchParams?.date || last30Days[0]}
    />
  );
}
