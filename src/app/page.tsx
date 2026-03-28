import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white p-6 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#0A2463]">SinuFila.com</h1>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-600 hover:text-[#0A2463] font-semibold flex items-center">
            Iniciar Sesión
          </Link>
          <Link href="/api/demo-seed" className="bg-[#4CAF82] text-white px-4 py-2 rounded-md hover:bg-[#3d8c68] transition-colors font-bold shadow-sm">
            Crear Demo Gratis
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-12">
        <h2 className="text-5xl md:text-6xl font-extrabold text-[#0A2463] mb-6 leading-tight">
          El Sistema de Gestión de Turnos <span className="text-[#00838F]">Inteligente</span>
        </h2>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl">
          Evite las aglomeraciones y mejore la experiencia de sus clientes con SinuFila. 
          Llamado por voz, pantallas en tiempo real y estadísticas detalladas para su empresa.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 relative z-10">
          <Link href="/login" className="bg-[#0A2463] text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-[#081b4b] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            Plataforma SaaS
          </Link>
          <Link href="/api/demo-seed" className="bg-white text-[#0A2463] border-2 border-[#0A2463] px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-50 transition-all">
            Ver Demo Interactiva
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl w-full">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📺</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Pantallas Interactivas</h3>
            <p className="text-gray-500">Muestre llamados llamativos con voz generada por inteligencia artificial en los televisores de su sala de espera.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">🖨️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Kioskos de Autoservicio</h3>
            <p className="text-gray-500">Dispensadores de tickets digitales impresos al calor con códigos QR para el seguimiento portátil desde el celular.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Reportes en Tiempo Real</h3>
            <p className="text-gray-500">Mida los tiempos de atención, abandonos y cuellos de botella mediante paneles de control administrativos modernos.</p>
          </div>
        </div>
      </main>

      <footer className="bg-[#0A2463] text-blue-200 py-8 text-center text-sm">
        <p>© 2026 SinuFila SaaS. Creado para la gestión avanzada de filas y turnos.</p>
      </footer>
    </div>
  );
}
