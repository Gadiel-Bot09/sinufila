import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DispensadorLayout({
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
    <div className="flex min-h-screen bg-gray-100 flex-col relative w-full overflow-hidden touch-none select-none">
      <main className="flex-1 flex w-full h-full">
        {children}
      </main>
    </div>
  );
}
