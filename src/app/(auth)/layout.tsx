export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — diseño de marca */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A2463 0%, #163580 40%, #00838F 100%)' }}>

        {/* Patron de fondo animado */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/5"
              style={{
                width: `${(i + 1) * 200}px`,
                height: `${(i + 1) * 200}px`,
                left: `${-100 + i * 30}px`,
                top: `${-100 + i * 20}px`,
              }}
            />
          ))}
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#00838F]/10 blur-3xl" />
          <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-blue-400/5 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center text-white font-black text-lg border border-white/20">
              S
            </div>
            <span className="text-white font-black text-2xl tracking-tight">SinuFila</span>
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
              Gestión de Turnos
              <br />
              <span className="text-[#4ECBD4]">Inteligente</span>
            </h1>
            <p className="text-blue-200 text-lg mt-4 leading-relaxed max-w-md">
              La plataforma SaaS multi-tenant que transforma la experiencia de atención al público en hospitales, bancos y entidades gubernamentales.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: '⚡', text: 'Tiempo Real' },
              { icon: '🔊', text: 'Voz TTS' },
              { icon: '🎫', text: 'Impresión QR' },
              { icon: '📊', text: 'Reportes' },
              { icon: '🏢', text: 'Multi-tenant' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
                <span>{f.icon}</span>
                <span className="text-white/90 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {[
              { value: '< 2s', label: 'Llamado en pantalla' },
              { value: '99.9%', label: 'Uptime garantizado' },
              { value: '∞', label: 'Entidades soportadas' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-black text-[#4ECBD4]">{stat.value}</div>
                <div className="text-blue-300 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/40 text-sm">© 2025 SinuFila. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Panel derecho — formularios */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#F8FAFB] overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo mobile only */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-[#0A2463] rounded-lg flex items-center justify-center text-white font-black text-sm">S</div>
            <span className="text-[#0A2463] font-black text-xl">SinuFila</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
