import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const signIn = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect('/login?message=No se pudo iniciar sesión. Verifica tus credenciales.');
    }

    return redirect('/admin/dashboard');
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 h-screen mx-auto">
      <form
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        action={signIn}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0A2463]">SinuFila</h1>
          <p className="text-muted-foreground">Sistema de Gestión de Turnos</p>
        </div>

        <label className="text-md" htmlFor="email">
          Correo electrónico
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="usuario@entidad.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Contraseña
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button className="bg-[#0A2463] text-white rounded-md px-4 py-2 text-foreground mb-2 mt-2 hover:bg-[#081b4b] transition-colors">
          Iniciar Sesión
        </button>

        {searchParams?.message && (
          <p className="mt-4 p-4 bg-red-100 text-red-600 text-center rounded-md text-sm">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  );
}
