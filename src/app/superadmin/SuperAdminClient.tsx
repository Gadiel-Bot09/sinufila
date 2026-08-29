'use client';

import { useState } from 'react';
import { toggleEntityStatus } from './actions';

type EntityData = {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  operatorsCount: number;
};

export default function SuperAdminClient({ initialEntities }: { initialEntities: EntityData[] }) {
  const [entities, setEntities] = useState<EntityData[]>(initialEntities);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (id: string, currentState: boolean) => {
    if (!confirm(`¿Estás seguro de que deseas ${currentState ? 'desactivar' : 'activar'} esta institución? ${currentState ? 'Sus usuarios no podrán operar.' : ''}`)) {
      return;
    }

    setLoadingId(id);
    const success = await toggleEntityStatus(id, currentState);
    if (success) {
      setEntities(prev => prev.map(ent => 
        ent.id === id ? { ...ent, is_active: !currentState } : ent
      ));
    } else {
      alert('Hubo un error al actualizar el estado de la institución.');
    }
    setLoadingId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Institución</th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Fecha Registro</th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-center">Operadores</th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-center">Estado</th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entities.map(ent => (
              <tr key={ent.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-[#0A2463] text-lg">{ent.name}</div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">{ent.id}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(ent.created_at).toLocaleDateString('es-CO', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  })}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    {ent.operatorsCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {ent.is_active ? (
                    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-200">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-bold border border-red-200">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Bloqueada
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleToggle(ent.id, ent.is_active)}
                    disabled={loadingId === ent.id}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      ent.is_active 
                        ? 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300' 
                        : 'bg-[#0A2463] text-white hover:bg-[#081b4b]'
                    } disabled:opacity-50`}
                  >
                    {loadingId === ent.id ? '...' : ent.is_active ? 'Bloquear' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {entities.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No hay instituciones registradas aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
