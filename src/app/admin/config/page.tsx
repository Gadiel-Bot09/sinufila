import Link from "next/link";
import { Settings, ListCollapse, AlertCircle, Volume2, MonitorPlay, FileText, MessageCircle } from "lucide-react";

const configOptions = [
  {
    title: "Entidad",
    description: "Configura el nombre, logo, y apariencia visual de la entidad.",
    icon: Settings,
    href: "/admin/config/entidad",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Servicios",
    description: "Administra las áreas de atención (Caja, Asesoría, etc).",
    icon: ListCollapse,
    href: "/admin/config/servicios",
    color: "bg-teal-100 text-teal-600",
  },
  {
    title: "Prioridades",
    description: "Niveles de prioridad: Adulto Mayor, Embarazadas, Normal.",
    icon: AlertCircle,
    href: "/admin/config/prioridades",
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Llamado por Voz",
    description: "Configura la voz, velocidad y número de repeticiones.",
    icon: Volume2,
    href: "/admin/config/voz",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Pantalla Pública",
    description: "Videos de espera, marquesina y animaciones de llamado.",
    icon: MonitorPlay,
    href: "/admin/config/display",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "Tickets / Impresión",
    description: "Ajusta la impresora térmica, tamaño y texto del ticket.",
    icon: FileText,
    href: "/admin/config/tickets",
    color: "bg-gray-100 text-gray-600",
  },
  {
    title: "WhatsApp API",
    description: "Configura notificaciones vía Evolution API (gratis).",
    icon: MessageCircle,
    href: "/admin/config/whatsapp",
    color: "bg-green-100 text-green-600",
  },
];

export default function ConfigIndexPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0A2463]">Configuración del Sistema</h1>
        <p className="text-gray-500 mt-2">Personaliza el comportamiento y la apariencia de la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <Link key={opt.href} href={opt.href}>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${opt.color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{opt.title}</h3>
                <p className="text-gray-500 mt-2 text-sm">{opt.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
