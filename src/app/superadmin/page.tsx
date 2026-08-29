import { createAdminClient } from '@/lib/supabase/admin';
import SuperAdminClient from './SuperAdminClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  // adminSupabase ignora RLS para poder ver TODAS las instituciones
  const adminSupabase = createAdminClient();

  // Traer todas las entidades
  const { data: entities } = await adminSupabase
    .from('entities')
    .select('id, name, created_at, config_json')
    .order('created_at', { ascending: false });

  // Traer operadores para contar cuántos tiene cada institución
  const { data: operators } = await adminSupabase
    .from('operators')
    .select('id, entity_id');

  const entitiesWithStats = (entities || []).map(ent => {
    // Si is_active no existe, asumimos que está activa por defecto
    const isActive = ent.config_json?.is_active !== false; 
    
    return {
      id: ent.id,
      name: ent.name,
      created_at: ent.created_at,
      is_active: isActive,
      operatorsCount: operators?.filter(o => o.entity_id === ent.id).length || 0,
    };
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Instituciones Registradas</h2>
        <p className="text-gray-500 text-lg">Panel maestro para administrar las entidades de la plataforma SinuFila.</p>
      </div>
      
      <SuperAdminClient initialEntities={entitiesWithStats} />
    </div>
  );
}
