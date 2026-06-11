import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LogOut } from "lucide-react";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single() as { data: { role: string } | null };
  if (profile?.role !== "super_admin") {
    redirect("/app/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Admin sidebar */}
      <aside
        className="flex flex-col h-full w-56 flex-shrink-0"
        style={{ background: "rgba(13,13,20,0.92)", backdropFilter: "blur(8px)", borderRight: "1px solid rgba(168,85,247,0.18)" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: "1px solid rgba(168,85,247,0.15)", minHeight: "68px" }}
        >
          <img
            src="https://xfientejntectnwbqmdr.supabase.co/storage/v1/object/public/Logo%20Nova/Gemini_Generated_Image_mq47ltmq47ltmq47-removebg-preview.png"
            alt="Nova"
            className="w-9 h-9 object-contain"
            style={{ filter: "drop-shadow(0 0 8px rgba(168,85,247,0.4))" }}
          />
          <div>
            <p className="font-bold text-sm text-[#F1F5F9]">Nova HQ</p>
            <p className="text-[10px] neon-text">Super Admin</p>
          </div>
        </div>

        <AdminNav />

        <div className="p-3" style={{ borderTop: "1px solid rgba(168,85,247,0.15)" }}>
          <Link
            href="/app/dashboard"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#64748B] hover:text-[#a78bfa] transition-colors"
          >
            <LogOut size={13} strokeWidth={2} />
            Volver al app
          </Link>
          <p className="text-[10px] text-[#475569] px-3 mt-1 truncate">{user.email}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
