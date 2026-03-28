'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    institution_name: '',
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!form.institution_name.trim()) {
      setError('El nombre de la institución es requerido.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          institution_name: form.institution_name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // El trigger de Supabase crea la entidad automáticamente
    router.push('/admin/dashboard?welcome=1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2463] via-[#163580] to-[#00838F] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight">SinuFila</h1>
          <p className="text-blue-200 mt-2">Sistema de Gestión de Turnos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-[#0A2463] mb-1">Registra tu Institución</h2>
          <p className="text-gray-500 text-sm mb-6">
            Crea tu cuenta administradora y configura tu sistema de turnos en minutos.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Institución *
              </label>
              <input
                type="text"
                name="institution_name"
                required
                value={form.institution_name}
                onChange={handleChange}
                placeholder="Ej: Hospital San Rafael, Banco Nacional..."
                className="w-full border rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00838F] bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tu Nombre Completo *
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={form.full_name}
                onChange={handleChange}
                placeholder="Nombre del administrador"
                className="w-full border rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00838F] bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="admin@institución.com"
                className="w-full border rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00838F] bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00838F] bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar *
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Repite la contraseña"
                  className="w-full border rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00838F] bg-gray-50"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-[#0A2463] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#081b4b] transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {loading ? 'Creando tu cuenta...' : '🚀 Crear Cuenta y Comenzar'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#00838F] font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>

        <p className="text-center text-blue-200/70 text-xs mt-6">
          Al registrarte aceptas los términos de servicio de SinuFila.
        </p>
      </div>
    </div>
  );
}
