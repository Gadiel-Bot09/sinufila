import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  // Bloquear en producción a menos que se provea el secret correcto
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.DEMO_SECRET;

  if (isProduction && (!expectedSecret || secret !== expectedSecret)) {
    return NextResponse.json(
      { error: 'No disponible en producción. Usa el parámetro ?secret=TU_DEMO_SECRET si eres el administrador.' },
      { status: 403 }
    );
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión primero.' }, { status: 401 });
  }

  // Check if they already have an operator
  const { data: operator } = await supabase
    .from('operators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (operator) {
    return NextResponse.json({ message: 'Ya tienes una entidad configurada.' });
  }

  // 1. Create Entity
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .insert({
      name: 'Clínica Demo SinuFila',
      config_json: { hours: '08:00 - 18:00' }
    })
    .select()
    .single();

  if (entityError || !entity) {
    return NextResponse.json({ error: 'Error creando entidad', details: entityError }, { status: 500 });
  }

  // 2. Create Operator (Admin)
  await supabase.from('operators').insert({
    entity_id: entity.id,
    user_id: user.id,
    name: 'Administrador Demo',
  });

  // 3. Create Services
  const { data: services } = await supabase
    .from('services')
    .insert([
      { entity_id: entity.id, name: 'Consulta General', prefix: 'C', color: '#00838F', avg_time_minutes: 15 },
      { entity_id: entity.id, name: 'Urgencias', prefix: 'U', color: '#E63946', avg_time_minutes: 30 },
      { entity_id: entity.id, name: 'Laboratorio', prefix: 'L', color: '#0A2463', avg_time_minutes: 10 },
      { entity_id: entity.id, name: 'Caja', prefix: 'P', color: '#4CAF82', avg_time_minutes: 5 },
    ])
    .select();

  // 4. Create Priority Levels
  await supabase.from('priority_levels').insert([
    { entity_id: entity.id, name: 'Emergencia', level: 1, color: '#E63946', icon: '🔴', description: 'Riesgo vital' },
    { entity_id: entity.id, name: 'Alta Prioridad', level: 2, color: '#FF6B35', icon: '🟠', description: 'Embarazadas, niños' },
    { entity_id: entity.id, name: 'Preferencial', level: 3, color: '#FFD166', icon: '🟡', description: 'Adultos mayores, discapacidad' },
    { entity_id: entity.id, name: 'Normal', level: 4, color: '#4CAF82', icon: '🟢', description: 'Público general' },
  ]);

  // 5. Create Display Config
  await supabase.from('display_config').insert({
    entity_id: entity.id,
    video_url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1',
    ticker_text: 'Recuerde mantener silencio en la sala y estar atento a su turno. ¡Gracias por usar SinuFila!',
  });

  // 6. Create Print Config
  await supabase.from('ticket_print_config').insert({
    entity_id: entity.id,
    paper_size: '58mm',
    show_logo: true,
    show_qr: true,
    header_message: 'Clínica Demo SinuFila',
    footer_message: '¡Gracias por su visita!',
  });

  // 7. Create Windows
  await supabase.from('windows').insert([
    { entity_id: entity.id, name: 'Recepción 1', number: '1', service_id: services?.[0].id },
    { entity_id: entity.id, name: 'Recepción 2', number: '2', service_id: services?.[0].id },
    { entity_id: entity.id, name: 'Caja Principal', number: '3', service_id: services?.[3].id },
    { entity_id: entity.id, name: 'Urgencias triage', number: '4', service_id: services?.[1].id },
  ]);

  return NextResponse.redirect(new URL('/admin/dashboard', req.url));
}
