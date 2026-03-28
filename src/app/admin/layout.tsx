import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const navSections: { label: string; links: { href: string; label: string; icon: string; external?: boolean }[] }[] = [
    {
      label: 'Principal',
      links: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/admin/reportes', label: 'Reportes', icon: '📈' },
      ],
    },
    {
      label: 'Configuración',
      links: [
        { href: '/admin/config/entidad', label: 'Mi Institución', icon: '🏛️' },
        { href: '/admin/config/servicios', label: 'Servicios', icon: '📋' },
        { href: '/admin/config/prioridades', label: 'Prioridades', icon: '🎯' },
        { href: '/admin/config/ventanillas', label: 'Ventanillas', icon: '🏢' },
        { href: '/admin/config/operadores', label: 'Operadores', icon: '👥' },
        { href: '/admin/config/voz', label: 'Voz TTS', icon: '🔊' },
        { href: '/admin/config/display', label: 'Pantalla Pública', icon: '📺' },
        { href: '/admin/config/tickets', label: 'Configuración Tickets', icon: '🖨️' },
      ],
    },
    {
      label: 'Módulos',
      links: [
        { href: '/dispensador', label: 'Dispensador (Kiosk)', icon: '🎫', external: true },
        { href: '/operador', label: 'Panel Operador', icon: '🧑‍💻', external: true },
        { href: '/display', label: 'Pantalla Pública (TV)', icon: '📺', external: true },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFB]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0A2463] text-white flex flex-col py-6 px-4 min-h-screen shrink-0 shadow-xl">
        {/* Brand */}
        <div className="mb-8 px-2">
          <h2 className="text-2xl font-black tracking-tight">SinuFila</h2>
          <p className="text-blue-300 text-xs mt-0.5">Panel de Administración</p>
        </div>

        {/* Nav Sections */}
        <nav className="flex flex-col gap-5 flex-1 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-blue-400 text-[10px] uppercase tracking-widest font-semibold mb-1.5 px-2">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.links.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium text-blue-100 hover:text-white"
                  >
                    <span className="text-base">{link.icon}</span>
                    <span className="truncate">{link.label}</span>
                    {link.external && <span className="ml-auto text-blue-400 text-xs">↗</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Signout */}
        <div className="pt-4 border-t border-white/10 mt-4">
          <p className="text-blue-300 text-xs mb-2 truncate px-2">{user.email}</p>
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
