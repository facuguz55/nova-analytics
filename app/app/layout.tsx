import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import PaywallCard from "@/components/paywall/PaywallCard";
import { Analytics } from "@vercel/analytics/next";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  type UserRow = { name: string | null; email: string; avatar_url: string | null; workspaces: { id: string; name: string; plan: string; status: string } | null };
  type IntRow = { provider: string; status: string };

  const [{ data: rawUserRow }, { data: rawIntegrations }, { count: alertCount }] = await Promise.all([
    supabase.from("users").select("*, workspaces(id, name, plan, status)").eq("id", user.id).single(),
    supabase.from("integrations").select("provider, status").eq("status", "active"),
    supabase.from("alerts").select("id", { count: "exact", head: true }).eq("read", false),
  ]);

  const userRow = rawUserRow as unknown as UserRow | null;
  const integrations = (rawIntegrations ?? []) as unknown as IntRow[];
  const workspace = userRow?.workspaces ?? null;

  const activeProviders = new Set(integrations.map((i) => i.provider));

  const { data: rawProfile } = await supabase.from("users").select("role").eq("id", user.id).single() as { data: { role: string } | null };
  const isSuperAdmin = rawProfile?.role === "super_admin";
  const plan = workspace?.plan ?? "free";
  const isLocked = !isSuperAdmin && plan !== "trial" && plan !== "active";

  const alerts = alertCount ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      <Sidebar
        userName={userRow?.name ?? user.email?.split("@")[0] ?? "Usuario"}
        userEmail={userRow?.email ?? user.email ?? ""}
        avatarUrl={userRow?.avatar_url ?? null}
        workspaceName={workspace?.name ?? "Mi Tienda"}
        workspacePlan={plan}
        activeProviders={Array.from(activeProviders)}
        alertCount={alerts}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          userName={userRow?.name ?? user.email?.split("@")[0] ?? "Usuario"}
          avatarUrl={userRow?.avatar_url ?? null}
          alertCount={alerts}
        />
        <main className="relative flex-1 overflow-y-auto bg-[#0a0a0f]">
          {isLocked && (
            <>
              {/* Preview borroso */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.35 }}>
                {children}
              </div>
              {/* Overlay paywall */}
              <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "rgba(10,10,15,0.7)" }}>
                <PaywallCard />
              </div>
            </>
          )}
          {!isLocked && children}
        </main>
      </div>
      <Analytics />
    </div>
  );
}
