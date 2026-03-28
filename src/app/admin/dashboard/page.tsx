export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0A2463] mb-6">Dashboard Administrativo</h1>
      <p className="text-gray-600">Bienvenido al panel de control de SinuFila.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Turnos Hoy</h3>
          <p className="text-4xl font-bold text-[#00838F] mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Tiempo de Espera Prom.</h3>
          <p className="text-4xl font-bold text-[#FF6B35] mt-2">0 min</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Ventanillas Activas</h3>
          <p className="text-4xl font-bold text-[#4CAF82] mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
