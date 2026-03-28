'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase maneja el hash automáticamente al cargar esta página
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    setState('loading');
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado. Solicita uno nuevo.');
      setState('error');
      return;
    }

    setState('success');
    setTimeout(() => router.push('/login'), 2500);
  };

  const strengthChecks = [
    { ok: password.length >= 8, label: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(password), label: 'Una mayúscula' },
    { ok: /[0-9]/.test(password), label: 'Un número' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Un símbolo especial' },
  ];

  if (state === 'success') {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          ✅
        </div>
        <h2 className="text-2xl font-black text-[#0A2463] mb-3">
          ¡Contraseña actualizada!
        </h2>
        <p className="text-gray-500 mb-8">
          Tu contraseña fue cambiada exitosamente. Te redirigimos al login...
        </p>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#4CAF82] rounded-full animate-[progress_2.5s_linear]" style={{ width: '100%', transition: 'width 2.5s linear' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="w-14 h-14 bg-[#0A2463]/10 rounded-2xl flex items-center justify-center text-2xl mb-5">
          🔐
        </div>
        <h2 className="text-3xl font-black text-[#0A2463] tracking-tight">
          Nueva Contraseña
        </h2>
        <p className="text-gray-500 mt-2">
          Elige una contraseña segura para tu cuenta.
        </p>
      </div>

      {!ready && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm mb-5 flex items-center gap-2">
          <span>⏳</span>
          <span>Verificando enlace de recuperación...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">Nueva contraseña</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
            <input
              type={showPass ? 'text' : 'password'}
              required
              disabled={!ready}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Mínimo 8 caracteres"
              className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all disabled:opacity-50"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm p-1">
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Strength indicator */}
        {password && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600 mb-2">Fortaleza de contraseña:</p>
            <div className="flex gap-1 mb-3">
              {strengthChecks.map((c, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${c.ok ? 'bg-[#4CAF82]' : 'bg-gray-200'}`} />
              ))}
            </div>
            {strengthChecks.map(c => (
              <div key={c.label} className="flex items-center gap-2">
                <span className={`text-xs ${c.ok ? 'text-[#4CAF82]' : 'text-gray-400'}`}>{c.ok ? '✓' : '○'}</span>
                <span className={`text-xs ${c.ok ? 'text-gray-600' : 'text-gray-400'}`}>{c.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">Confirmar nueva contraseña</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
            <input
              type={showPass ? 'text' : 'password'}
              required
              disabled={!ready}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              placeholder="Repite tu nueva contraseña"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00838F]/40 focus:border-[#00838F] transition-all disabled:opacity-50"
            />
            {confirm && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                {confirm === password ? '✅' : '❌'}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={state === 'loading' || !ready}
          className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all disabled:opacity-70 disabled:cursor-wait relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #0A2463, #163580)' }}
        >
          <span className="relative z-10">
            {state === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Guardando...
              </span>
            ) : '🔐 Guardar Nueva Contraseña'}
          </span>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all" />
        </button>
      </form>
    </div>
  );
}
