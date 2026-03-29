import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SinuFila — Sistema Inteligente de Gestión de Turnos",
  description: "Plataforma SaaS líder para clínicas, bancos y oficinas: kiosks de autoservicio, pantalla TV en tiempo real, voz TTS y reportes avanzados.",
  openGraph: {
    title: "SinuFila — Gestión de Turnos Inteligente",
    description: "Elimina las filas caóticas. Digitaliza tu sala de espera con SinuFila.",
    url: "https://sinufila.sinuhub.com",
  },
};

const features = [
  {
    icon: "🎫",
    title: "Kiosk de Autoservicio",
    description: "Tablet o PC en recepción. Pacientes seleccionan servicio y prioridad. Ticket impreso al instante con QR de seguimiento.",
    color: "#0A2463",
    gradient: "from-[#0A2463]/10 to-[#0A2463]/5",
  },
  {
    icon: "📺",
    title: "Pantalla Pública en TV",
    description: "Cualquier televisor se convierte en pantalla de turnos en tiempo real. Llamado por voz TTS integrado.",
    color: "#00838F",
    gradient: "from-[#00838F]/10 to-[#00838F]/5",
  },
  {
    icon: "🧑‍💼",
    title: "Panel de Operadores",
    description: "Cada operador ve su cola filtrada. Atiende, salta o transfiere turnos. Con ventanilla asignada en tiempo real.",
    color: "#4CAF82",
    gradient: "from-[#4CAF82]/10 to-[#4CAF82]/5",
  },
  {
    icon: "📊",
    title: "Reportes y Estadísticas",
    description: "Tiempos de espera, eficiencia de atención, demanda por servicio. Exporta a CSV con un clic.",
    color: "#FF6B35",
    gradient: "from-[#FF6B35]/10 to-[#FF6B35]/5",
  },
  {
    icon: "🔊",
    title: "Voz TTS Configurável",
    description: "El sistema anuncia cada turno por voz. Personaliza el mensaje, idioma y número de repeticiones.",
    color: "#8B5CF6",
    gradient: "from-purple-500/10 to-purple-500/5",
  },
  {
    icon: "📱",
    title: "Seguimiento por QR",
    description: "El paciente escanea su ticket impreso y ve el estado de su turno en tiempo real desde su celular.",
    color: "#EC4899",
    gradient: "from-pink-500/10 to-pink-500/5",
  },
];

const plans = [
  {
    name: "Básico",
    emoji: "🏢",
    price: "Gratis",
    period: "para siempre",
    description: "Perfecto para una sede pequeña.",
    color: "border-gray-200",
    btnStyle: "bg-white text-[#0A2463] border-2 border-[#0A2463] hover:bg-gray-50",
    features: [
      "1 sede / institución",
      "1 kiosk dispensador",
      "1 pantalla pública",
      "Hasta 2 operadores",
      "Reportes del día actual",
      "Soporte por email",
    ],
    popular: false,
  },
  {
    name: "Profesional",
    emoji: "🚀",
    price: "$49.000",
    period: "COP / mes",
    description: "Para clínicas y oficinas en crecimiento.",
    color: "border-[#0A2463]",
    btnStyle: "bg-[#0A2463] text-white hover:bg-[#081b4b]",
    features: [
      "1 sede / institución",
      "Kiosks ilimitados",
      "Pantallas ilimitadas",
      "Operadores ilimitados",
      "Reportes históricos 30 días",
      "Exportación CSV",
      "Soporte prioritario",
    ],
    popular: true,
  },
  {
    name: "Empresarial",
    emoji: "🏛️",
    price: "A medida",
    period: "contactar ventas",
    description: "Para redes de sedes y grandes empresas.",
    color: "border-gray-200",
    btnStyle: "bg-[#00838F] text-white hover:bg-[#006b76]",
    features: [
      "Sedes ilimitadas",
      "Multi-tenancy completo",
      "Reportes consolidados",
      "Integración API REST",
      "SLA garantizado",
      "Capacitación incluida",
      "Gerente de cuenta dedicado",
    ],
    popular: false,
  },
];

const stats = [
  { value: "98%", label: "Satisfacción de clientes" },
  { value: "<2min", label: "Tiempo promedio de espera" },
  { value: "100%", label: "Disponibilidad SaaS" },
  { value: "24/7", label: "Monitoreo en tiempo real" },
];

const sectors = [
  { icon: "🏥", name: "Clínicas y IPS" },
  { icon: "🏦", name: "Bancos y Cooperativas" },
  { icon: "🏛️", name: "Alcaldías y Gobernaciones" },
  { icon: "📋", name: "Consultorios Médicos" },
  { icon: "🏪", name: "Centros Comerciales" },
  { icon: "✈️", name: "Aeropuertos" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-[#0A2463]">
            <span className="w-8 h-8 bg-[#0A2463] rounded-lg flex items-center justify-center text-white font-black text-sm">S</span>
            SinuFila
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#0A2463] transition-colors">Funcionalidades</a>
            <a href="#sectors" className="hover:text-[#0A2463] transition-colors">Sectores</a>
            <a href="#pricing" className="hover:text-[#0A2463] transition-colors">Precios</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-[#0A2463] transition-colors px-3 py-2">
              Iniciar Sesión
            </Link>
            <Link href="/signup" className="text-sm font-bold bg-[#0A2463] text-white px-5 py-2.5 rounded-xl hover:bg-[#081b4b] transition-all shadow-md hover:shadow-lg">
              Comenzar Gratis →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background mesh */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0A2463]/8 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#00838F]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-[#4CAF82]/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#0A2463]/8 border border-[#0A2463]/20 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0A2463] mb-8">
            <span className="w-1.5 h-1.5 bg-[#4CAF82] rounded-full animate-pulse" />
            Sistema operativo en tiempo real • Colombia
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#0A2463] mb-6 leading-[1.05] tracking-tight">
            Digitaliza tu sala<br />
            de espera con{" "}
            <span className="relative">
              <span className="relative z-10 text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #00838F, #4CAF82)" }}>
                SinuFila
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full opacity-40" style={{ background: "linear-gradient(135deg, #00838F, #4CAF82)" }} />
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Kiosk de turnos, pantalla TV en tiempo real, voz TTS y reportes avanzados.
            Sin caos, sin aglomeraciones. <strong className="text-gray-700">Todo SaaS, sin instalación.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-[#0A2463] text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-[#081b4b] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              🚀 Comenzar Gratis
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#0A2463] border-2 border-gray-200 px-8 py-4 rounded-2xl text-lg font-bold hover:border-[#0A2463]/30 hover:bg-gray-50 transition-all"
            >
              Ver Demo →
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map(s => (
              <div key={s.value} className="text-center">
                <div className="text-3xl font-black text-[#0A2463] mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-gradient-to-br from-[#0A2463] to-[#163580] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-4">¿Cómo funciona?</h2>
          <p className="text-blue-200 text-lg mb-14">En 3 pasos, tu institución está operando digitalmente</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: "📲", title: "Regístrate", desc: "Crea tu cuenta en 2 minutos. Configura tus servicios, prioridades y ventanillas." },
              { step: "02", icon: "🎫", title: "Despliega", desc: "Abre el kiosk en una tablet, la pantalla en el TV y el panel en cada puesto de trabajo." },
              { step: "03", icon: "✅", title: "Opera", desc: "Los pacientes toman turnos, los operadores los atienden y los reportes se generan solos." },
            ].map(item => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-black text-white/10 absolute -top-4 left-0">{item.step}</div>
                <div className="relative bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-blue-200 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#0A2463] mb-4">Todo lo que necesitas incluido</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Sin módulos de pago extra. Sin sorpresas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(f => (
              <div
                key={f.title}
                className={`bg-gradient-to-br ${f.gradient} border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 group`}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-sm"
                  style={{ backgroundColor: f.color + '15', border: `1px solid ${f.color}30` }}
                >
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTORES ── */}
      <section id="sectors" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-[#0A2463] mb-4">Diseñado para tu sector</h2>
          <p className="text-gray-500 text-lg mb-12">SinuFila se adapta a cualquier institución con sala de espera.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {sectors.map(s => (
              <div key={s.name} className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:bg-[#0A2463] hover:text-white hover:border-[#0A2463] transition-all group cursor-default">
                <span className="text-3xl">{s.icon}</span>
                <span className="font-bold text-gray-700 group-hover:text-white text-left leading-tight">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#0A2463] mb-4">Planes para cada tamaño</h2>
            <p className="text-gray-500 text-lg">Sin contratos de permanencia. Cancela cuando quieras.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={`bg-white rounded-3xl border-2 ${plan.color} p-8 flex flex-col relative ${plan.popular ? 'shadow-2xl scale-105' : 'shadow-sm'} transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0A2463] text-white text-xs font-black px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    ⭐ MÁS POPULAR
                  </div>
                )}

                <div className="text-4xl mb-3">{plan.emoji}</div>
                <h3 className="text-xl font-black text-gray-800 mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-5">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-[#0A2463]">{plan.price}</span>
                  <span className="text-gray-400 text-sm ml-2">{plan.period}</span>
                </div>

                <Link
                  href={plan.name === "Empresarial" ? "mailto:ventas@sinuhub.com" : "/signup"}
                  className={`w-full py-3.5 rounded-xl font-bold text-center transition-all mb-7 block text-sm ${plan.btnStyle}`}
                >
                  {plan.name === "Empresarial" ? "Contactar ventas" : "Comenzar ahora →"}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="text-[#4CAF82] font-bold mt-0.5 shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 bg-gradient-to-br from-[#0A2463] to-[#00838F] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="text-5xl mb-6">🎫</div>
          <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
            Deja de perder pacientes<br />por esperas eternas
          </h2>
          <p className="text-blue-200 text-xl mb-10 max-w-xl mx-auto">
            Empieza hoy gratis. Sin tarjeta de crédito. Sin instalación. Tu institución lista en minutos.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#0A2463] px-10 py-5 rounded-2xl text-xl font-black hover:bg-blue-50 transition-all shadow-2xl hover:-translate-y-1"
          >
            🚀 Crear cuenta gratis
          </Link>
          <p className="text-blue-300 text-sm mt-6">Más de 50 instituciones activas en Colombia</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#050f2c] text-blue-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-black text-xl text-white mb-3">
                <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-black text-sm">S</span>
                SinuFila
              </div>
              <p className="text-blue-300 text-sm leading-relaxed max-w-sm">
                Sistema SaaS de gestión de turnos para clínicas, bancos y entidades gubernamentales de Colombia.
              </p>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Plataforma</p>
              <ul className="space-y-2 text-sm text-blue-300">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Iniciar sesión</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-3">Contacto</p>
              <ul className="space-y-2 text-sm text-blue-300">
                <li>soporte@sinuhub.com</li>
                <li>ventas@sinuhub.com</li>
                <li>Colombia • UTC-5</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-blue-400">
            <p>© 2026 SinuFila · SinuHub.com · Todos los derechos reservados</p>
            <p>Hecho con ❤️ para Colombia 🇨🇴</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
