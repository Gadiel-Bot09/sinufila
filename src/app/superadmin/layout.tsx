import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Correos autorizados para el panel maestro
const SUPERADMIN_EMAILS = ['gadielanaya19@gmail.com'];

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !SUPERADMIN_EMAILS.includes(user.email || '')) {
    // Si no es el superadmin, lo enviamos al login o dashboard normal
    redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#111827] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <h1 className="text-xl font-bold tracking-tight">SinuFila SuperAdmin</h1>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-gray-400 text-sm font-medium">{user.email}</span>
          <Link href="/admin/dashboard" className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            Volver a mi institución
          </Link>
        </div>
      </header>
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
