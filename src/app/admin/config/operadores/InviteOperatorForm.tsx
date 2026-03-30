'use client';

import { useState } from "react";
import { inviteOperator } from "./actions";

type WindowOption = {
  id: string;
  name: string;
  number: string;
};

export default function InviteOperatorForm({ windows }: { windows: WindowOption[] | null }) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const result = await inviteOperator(formData);

    if (result && result.error) {
      setErrorMsg(result.error);
    } else if (result && result.success) {
      setSuccessMsg(result.message || 'Operador invitado con éxito.');
      (e.target as HTMLFormElement).reset();
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Invitar Operador</h2>
      <p className="text-sm text-gray-500 mb-4">
        Se enviará un correo de invitación con instrucciones para crear su contraseña.
      </p>

      {successMsg && (
        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 text-sm font-medium">
          ✅ {successMsg}
        </div>
      )}
      
      {errorMsg && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm font-medium">
          ❌ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            type="text"
            name="name"
            required
            placeholder="Nombre del operador"
            className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00838F]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input
            type="email"
            name="email"
            required
            placeholder="operador@tuinstitucion.com"
            className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00838F]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select
            name="role"
            className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00838F]"
          >
            <option value="operator">Operador (Atiende turnos)</option>
            <option value="admin">Administrador (Acceso total)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ventanilla Asignada</label>
          <select
            name="window_id"
            className="w-full border rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00838F]"
          >
            <option value="">— Sin asignar —</option>
            {windows?.map(w => (
              <option key={w.id} value={w.id}>
                Ventanilla {w.number} — {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end mt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0A2463] text-white px-6 py-2 rounded-md hover:bg-[#081b4b] transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Enviando...' : '📧 Enviar Invitación'}
          </button>
        </div>
      </form>
    </div>
  );
}
