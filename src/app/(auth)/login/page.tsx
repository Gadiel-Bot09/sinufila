'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Correo o contraseña incorrectos. Verifica tus credenciales.');
      setLoading(false);
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#0A2463] tracking-tight">
          Iniciar Sesión
        </h2>
        <p className="text-gray-500 mt-2">
          Accede a tu panel de administración
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="email">
            Correo electrónico
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">✉</span>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@institución.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700" htmlFor="password">
              Contraseña
            </label>
            <Link href="/forgot-password" className="text-sm text-[#00838F] hover:text-[#006b77] font-medium transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔒</span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors p-1"
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all disabled:opacity-70 disabled:cursor-wait relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #0A2463, #163580)' }}
        >
          <span className="relative z-10">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Iniciando sesión...
              </span>
            ) : 'Iniciar Sesión →'}
          </span>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all" />
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">¿Nuevo en SinuFila?</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Sign Up link */}
      <Link
        href="/signup"
        className="w-full py-3.5 rounded-xl font-bold text-[#0A2463] text-base border-2 border-[#0A2463]/20 bg-white hover:bg-[#0A2463] hover:text-white hover:border-[#0A2463] transition-all flex items-center justify-center gap-2"
      >
        🏢 Registrar mi Institución
      </Link>

      <p className="text-center text-gray-400 text-xs mt-6">
        Al ingresar aceptas los{' '}
        <a href="#" className="text-[#00838F] hover:underline">Términos de Servicio</a>
        {' '}y la{' '}
        <a href="#" className="text-[#00838F] hover:underline">Política de Privacidad</a>
      </p>
    </div>
  );
}
