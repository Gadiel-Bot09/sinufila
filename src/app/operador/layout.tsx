import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OperadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col relative w-full overflow-hidden">
      {/* Top Header for Operator */}
      <header className="w-full bg-[#0A2463] text-white p-4 shadow-md flex justify-between items-center z-10">
        <div>
          <h1 className="text-xl font-bold">SinuFila Operador</h1>
          <p className="text-sm text-gray-300">Ventanilla Activa</p>
        </div>
        <form action="/auth/signout" method="post">
           <button type="submit" className="text-sm bg-transparent text-gray-300 hover:text-white border px-3 py-1 rounded-md border-gray-500 hover:border-white transition-colors">
             Cerrar Sesión
           </button>
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex w-full">
        {children}
      </main>
    </div>
  );
}
