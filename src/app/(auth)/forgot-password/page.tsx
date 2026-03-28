'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type State = 'idle' | 'loading' | 'sent' | 'error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('loading');
    setError('');

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (resetError) {
      setError('No pudimos procesar tu solicitud. Verifica el correo e intenta de nuevo.');
      setState('error');
      return;
    }

    setState('sent');
  };

  if (state === 'sent') {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-[#00838F]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          📬
        </div>
        <h2 className="text-2xl font-black text-[#0A2463] mb-3">
          Revisa tu bandeja
        </h2>
        <p className="text-gray-500 mb-2">
          Si el correo <strong className="text-gray-700">{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          El enlace expira en 60 minutos. Revisa también tu carpeta de spam.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => { setState('idle'); setEmail(''); }}
            className="w-full py-3 rounded-xl font-semibold text-[#0A2463] border-2 border-[#0A2463]/20 hover:border-[#0A2463]/50 transition-all"
          >
            Reenviar correo
          </button>
          <Link
            href="/login"
            className="w-full py-3 rounded-xl font-semibold text-gray-500 hover:text-[#0A2463] transition-colors flex items-center justify-center"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-6 transition-colors w-fit">
          ← Volver al login
        </Link>
        <div className="w-14 h-14 bg-[#0A2463]/10 rounded-2xl flex items-center justify-center text-2xl mb-5">
          🔑
        </div>
        <h2 className="text-3xl font-black text-[#0A2463] tracking-tight">
          Recuperar Contraseña
        </h2>
        <p className="text-gray-500 mt-2">
          Ingresa tu correo y te enviaremos un enlace seguro para restablecerla.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@institución.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all"
            />
          </div>
        </div>

        {(state === 'error') && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all disabled:opacity-70 relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #0A2463, #163580)' }}
        >
          <span className="relative z-10">
            {state === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Enviando enlace...
              </span>
            ) : '📧 Enviar Enlace de Recuperación'}
          </span>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all" />
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        ¿Recordaste tu contraseña?{' '}
        <Link href="/login" className="text-[#00838F] font-semibold hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
