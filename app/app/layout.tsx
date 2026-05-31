import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import FloatingAI from "@/components/layout/FloatingAI";
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

  type UserRow = { name: string | null; email: string; avatar_url: string | null; role: string; workspaces: { id: string; name: string; plan: string; status: string; onboarding_completed: boolean } | null };
  type IntRow = { provider: string; status: string };

  const [userRes, intRes, alertRes] = await Promise.allSettled([
    supabase.from("users").select("*, workspaces(id, name, plan, status, onboarding_completed)").eq("id", user.id).single(),
    supabase.from("integrations").select("provider, status").eq("status", "active"),
    supabase.from("alerts").select("id", { count: "exact", head: true }).eq("read", false),
  ]);

  const rawUserRow = userRes.status === "fulfilled" ? userRes.value.data : null;
  const rawIntegrations = intRes.status === "fulfilled" ? intRes.value.data : null;
  const alertCount = alertRes.status === "fulfilled" ? alertRes.value.count : 0;

  const userRow = rawUserRow as unknown as UserRow | null;
  const integrations = (rawIntegrations ?? []) as unknown as IntRow[];
  const workspace = userRow?.workspaces ?? null;

  const activeProviders = new Set(integrations.map((i) => i.provider));

  const isSuperAdmin = userRow?.role === "super_admin";
  const plan = workspace?.plan ?? "free";

  // Redirigir al onboarding si no fue completado aún
  const onboardingCompleted = workspace?.onboarding_completed ?? false;
  if (!isSuperAdmin && !onboardingCompleted) redirect("/onboarding");

  // Verificar si el trial venció
  const trialStartedAt = (workspace as unknown as { trial_started_at?: string | null } | null)?.trial_started_at ?? null;
  const trialExpired = plan === "trial" && trialStartedAt
    ? Date.now() > new Date(trialStartedAt).getTime() + 14 * 86_400_000
    : false;

  const isLocked = !isSuperAdmin && (
    !["trial", "active", "pro", "agency"].includes(plan) || trialExpired
  );

  const alerts = alertCount ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Sidebar solo en sm+ */}
      <div className="hidden sm:flex h-full">
        <Sidebar
          userName={userRow?.name ?? user.email?.split("@")[0] ?? "Usuario"}
          userEmail={userRow?.email ?? user.email ?? ""}
          avatarUrl={userRow?.avatar_url ?? null}
          workspaceName={workspace?.name ?? "Mi Tienda"}
          workspacePlan={plan}
          activeProviders={Array.from(activeProviders)}
          alertCount={alerts}
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          userName={userRow?.name ?? user.email?.split("@")[0] ?? "Usuario"}
          avatarUrl={userRow?.avatar_url ?? null}
          alertCount={alerts}
        />
        {/* pb-16 en mobile para que no tape el BottomNav */}
        <main className="relative flex-1 overflow-y-auto bg-[#0a0a0f] pb-16 sm:pb-0">
          {isLocked ? (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "rgba(10,10,15,0.95)" }}>
              <PaywallCard
                workspaceId={workspace?.id ?? ""}
                userEmail={userRow?.email ?? user.email ?? ""}
              />
            </div>
          ) : (
            <>
              {children}
              <FloatingAI />
            </>
          )}
        </main>
      </div>
      {/* Bottom nav solo en mobile */}
      <BottomNav />
      <Analytics />
    </div>
  );
}
