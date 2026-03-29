'use client';

import { useState } from 'react';
import { toggleJornada } from './jornada-actions';

interface Props {
  isOpen: boolean;
  entityId: string;
}

export default function JornadaWidget({ isOpen: initialOpen, entityId }: Props) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    const result = await toggleJornada(!isOpen);
    if (!result.error) setIsOpen(!isOpen);
    setLoading(false);
  };

  return (
    <div className={`rounded-2xl p-5 border-2 transition-all ${
      isOpen
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Estado Jornada</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
            <span className={`text-lg font-black ${isOpen ? 'text-green-700' : 'text-red-700'}`}>
              {isOpen ? '🟢 Abierta' : '🔴 Cerrada'}
            </span>
          </div>
        </div>
        <span className="text-3xl">{isOpen ? '🏥' : '🔒'}</span>
      </div>

      <p className={`text-sm mb-4 ${isOpen ? 'text-green-600' : 'text-red-500'}`}>
        {isOpen
          ? 'El dispensador de turnos está activo y visible para los pacientes.'
          : 'El dispensador está bloqueado. Los pacientes verán una pantalla de "Jornada cerrada".'}
      </p>

      <button
        onClick={handle}
        disabled={loading}
        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${
          isOpen
            ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'
            : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300'
        }`}
      >
        {loading
          ? 'Actualizando...'
          : isOpen
          ? '🔒 Cerrar Jornada del Día'
          : '🟢 Abrir Jornada del Día'}
      </button>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 font-mono break-all">
          🎫 Dispensador: <a href={`/dispensador?entity=${entityId}`} target="_blank" className="text-blue-400 hover:underline">/dispensador?entity={entityId.slice(0, 8)}...</a>
        </p>
        <p className="text-xs text-gray-400 font-mono break-all mt-1">
          📺 Display: <a href={`/display?entity=${entityId}`} target="_blank" className="text-blue-400 hover:underline">/display?entity={entityId.slice(0, 8)}...</a>
        </p>
      </div>
    </div>
  );
}
