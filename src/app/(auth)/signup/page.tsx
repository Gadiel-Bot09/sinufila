'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 1, label: 'Tu institución', icon: '🏛️' },
  { id: 2, label: 'Tu cuenta', icon: '👤' },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    institution_name: '',
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.institution_name.trim()) {
      setError('El nombre de la institución es requerido.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
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

    // Enviar email de bienvenida
    if (data.user) {
      try {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            adminName: form.full_name,
            institutionName: form.institution_name,
          }),
        });
      } catch {
        // No bloquear si falla el email
      }
    }

    router.push('/admin/dashboard?welcome=1');
    router.refresh();
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-3xl font-black text-[#0A2463] tracking-tight">
          Comienza Gratis
        </h2>
        <p className="text-gray-500 mt-1.5">
          Configura tu sistema de turnos en minutos
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s.id
                    ? 'bg-[#0A2463] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.id ? '✓' : s.id}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step >= s.id ? 'text-[#0A2463]' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 min-w-[24px] transition-colors ${step > s.id ? 'bg-[#0A2463]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Nombre de tu Institución *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🏛️</span>
              <input
                type="text"
                name="institution_name"
                required
                value={form.institution_name}
                onChange={handleChange}
                placeholder="Ej: Hospital San Rafael, Banco Nacional..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all"
              />
            </div>
            <p className="text-xs text-gray-400">
              Este nombre aparecerá en los tickets y la pantalla pública.
            </p>
          </div>

          {/* Features highlight */}
          <div className="bg-gradient-to-br from-[#0A2463]/5 to-[#00838F]/5 border border-[#00838F]/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-[#0A2463]">¿Qué incluye tu cuenta?</p>
            {[
              '✅ Módulo Dispensador (Kiosk de turnos)',
              '✅ Panel de Operadores en tiempo real',
              '✅ Pantalla Pública con voz TTS',
              '✅ Reportes y estadísticas diarias',
              '✅ Configuración de servicios y prioridades',
            ].map(f => (
              <p key={f} className="text-xs text-gray-600">{f}</p>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #0A2463, #163580)' }}
          >
            <span className="relative z-10">Continuar →</span>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all" />
          </button>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#0A2463]/5 border border-[#0A2463]/10 rounded-xl p-3 flex items-center gap-3 mb-2">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="text-xs text-gray-500">Institución</p>
              <p className="text-sm font-bold text-[#0A2463]">{form.institution_name}</p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-[#00838F] hover:underline">
              Cambiar
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Tu nombre completo *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
              <input
                type="text"
                name="full_name"
                required
                value={form.full_name}
                onChange={handleChange}
                placeholder="Nombre del administrador"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Correo electrónico *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="admin@institución.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Contraseña *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mín. 8 caracteres"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Confirmar *</label>
              <input
                type={showPass ? 'text' : 'password'}
                name="confirm_password"
                required
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all text-sm"
              />
            </div>
          </div>

          {/* Password strength */}
          {form.password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[
                  form.password.length >= 8,
                  /[A-Z]/.test(form.password),
                  /[0-9]/.test(form.password),
                  /[^A-Za-z0-9]/.test(form.password),
                ].map((ok, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${ok ? 'bg-[#4CAF82]' : 'bg-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {form.password.length < 8 ? 'Mínimo 8 caracteres' :
                 !/[A-Z]/.test(form.password) ? 'Agrega una mayúscula' :
                 !/[0-9]/.test(form.password) ? 'Agrega un número' :
                 !/[^A-Za-z0-9]/.test(form.password) ? 'Contraseña fuerte ✓ (agrega símbolo para máxima seguridad)' :
                 '🔐 Contraseña muy fuerte'}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-3.5 rounded-xl font-bold text-[#0A2463] border-2 border-gray-200 hover:border-[#0A2463]/30 transition-all"
            >
              ← Atrás
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl font-bold text-white text-base transition-all disabled:opacity-70 disabled:cursor-wait relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #0A2463, #163580)' }}
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creando cuenta...
                  </span>
                ) : '🚀 Crear Cuenta'}
              </span>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all" />
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-gray-400 text-sm mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-[#00838F] font-semibold hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
