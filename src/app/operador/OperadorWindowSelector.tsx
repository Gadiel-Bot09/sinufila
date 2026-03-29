'use client';

import { useState } from 'react';
import { assignOperatorWindow } from './window-actions';
import { useRouter } from 'next/navigation';

interface Window {
  id: string;
  name: string;
  number: string;
}

interface Props {
  operatorId: string;
  operatorName: string;
  windows: Window[];
}

export default function OperadorWindowSelector({ operatorId, operatorName, windows }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!selected) {
      setError('Debes seleccionar una ventanilla para continuar.');
      return;
    }
    setLoading(true);
    setError('');

    const result = await assignOperatorWindow(operatorId, selected);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Recargar para que page.tsx detecte la ventanilla asignada
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2463] to-[#00838F] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0A2463]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🏢
          </div>
          <h1 className="text-2xl font-black text-[#0A2463]">Selecciona tu Ventanilla</h1>
          <p className="text-gray-500 mt-2">
            Hola <strong>{operatorName}</strong>. Elige la ventanilla desde la que vas a atender hoy.
          </p>
        </div>

        {/* Windows grid */}
        {windows.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {windows.map(w => (
              <button
                key={w.id}
                onClick={() => { setSelected(w.id); setError(''); }}
                className={`p-5 rounded-xl border-2 text-center transition-all ${
                  selected === w.id
                    ? 'border-[#0A2463] bg-[#0A2463] text-white shadow-lg scale-[1.02]'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#0A2463]/40 hover:bg-gray-100'
                }`}
              >
                <div className="text-3xl font-black mb-1">
                  {w.number}
                </div>
                <div className="text-sm font-medium truncate">{w.name}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 mb-6">
            <div className="text-4xl mb-3">😔</div>
            <p className="font-medium">No hay ventanillas activas.</p>
            <p className="text-sm mt-1">Pídele al administrador que cree y active las ventanillas.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading || windows.length === 0}
          className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #0A2463, #163580)' }}
        >
          <span className="relative z-10">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Asignando ventanilla...
              </span>
            ) : '✅ Comenzar a Atender'}
          </span>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all" />
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Puedes cambiar tu ventanilla desde el panel de administración.
        </p>
      </div>
    </div>
  );
}
