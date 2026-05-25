import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Zap, LayoutDashboard, Users, BarChart2, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single() as { data: { role: string } | null };
  if (profile?.role !== "super_admin") {
    redirect("/app/dashboard");
  }

  const nav = [
    { href: "/admin/hq", label: "HQ Dashboard", icon: LayoutDashboard },
    { href: "/admin/workspaces", label: "Workspaces", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Admin sidebar */}
      <aside
        className="flex flex-col h-full w-56 flex-shrink-0"
        style={{ background: "#0a0a0f", borderRight: "1px solid rgba(239,68,68,0.2)" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: "1px solid rgba(239,68,68,0.15)" }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ef4444] to-[#7C3AED] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#F1F5F9]">Nova HQ</p>
            <p className="text-[10px] text-red-400">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#94A3B8] transition-all hover:text-[#F1F5F9] hover:bg-[rgba(239,68,68,0.06)]"
            >
              <item.icon size={15} strokeWidth={2} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: "1px solid rgba(239,68,68,0.15)" }}>
          <Link
            href="/app/dashboard"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors"
          >
            <LogOut size={13} strokeWidth={2} />
            Volver al app
          </Link>
          <p className="text-[10px] text-[#475569] px-3 mt-1">{user.email}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
