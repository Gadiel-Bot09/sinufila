import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/config', label: 'Configuración', icon: '⚙️' },
    { href: '/admin/reportes', label: 'Reportes', icon: '📈' },
  ];

  const moduleLinks = [
    { href: '/dispensador', label: 'Dispensador (Kiosk)', icon: '🖨️' },
    { href: '/operador', label: 'Panel Operador', icon: '🧑‍💻' },
    { href: '/display', label: 'Pantalla Pública', icon: '📺' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFB]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A2463] text-white flex flex-col py-8 px-5 min-h-screen shrink-0 shadow-xl">
        {/* Brand */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight">SinuFila</h2>
          <p className="text-blue-300 text-xs mt-1">Panel de Administración</p>
        </div>

        {/* Main Nav */}
        <nav className="flex flex-col gap-1">
          <p className="text-blue-400 text-xs uppercase tracking-widest font-semibold mb-2">
            Principal
          </p>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium text-blue-100 hover:text-white"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Module Links */}
        <nav className="flex flex-col gap-1 mt-8">
          <p className="text-blue-400 text-xs uppercase tracking-widest font-semibold mb-2">
            Módulos
          </p>
          {moduleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium text-blue-200 hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{link.icon}</span>
              {link.label}
              <span className="ml-auto text-blue-400 text-xs">↗</span>
            </Link>
          ))}
        </nav>

        {/* Signout */}
        <div className="mt-auto pt-8 border-t border-white/10">
          <p className="text-blue-300 text-xs mb-3 truncate">{user.email}</p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full text-left text-sm text-blue-300 hover:text-white transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10"
            >
              <span>🚪</span> Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-10 overflow-auto">{children}</main>
    </div>
  );
}
