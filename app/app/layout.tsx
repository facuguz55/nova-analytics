import { redirect } from "next/navigation";
import { getUser, getCachedUserRow, getCachedIntegrations, getCachedAlertCount } from "@/lib/supabase/cached-queries";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import FloatingAI from "@/components/layout/FloatingAI";
import PaywallCard from "@/components/paywall/PaywallCard";
import AnimatedBackground from "@/components/layout/AnimatedBackground";
import PinnedBar from "@/components/layout/PinnedBar";
import { Analytics } from "@vercel/analytics/next";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const userRow = await getCachedUserRow(user.id);
  if (!userRow) redirect("/login");

  const workspaceId = userRow.workspace_id;
  const workspace = userRow.workspaces;

  const [integrations, alertCount] = await Promise.all([
    getCachedIntegrations(workspaceId),
    getCachedAlertCount(workspaceId),
  ]);

  const activeProviders = new Set(integrations.map((i) => i.provider));
  const isSuperAdmin = userRow.role === "super_admin";
  const plan = workspace?.plan ?? "free";

  const onboardingCompleted = workspace?.onboarding_completed ?? false;
  if (!isSuperAdmin && !onboardingCompleted) redirect("/onboarding");

  const isLocked = !isSuperAdmin && !["trial", "active", "pro", "agency"].includes(plan);
  const alerts = alertCount ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      <AnimatedBackground />
      {/* Sidebar solo en sm+ */}
      <div className="hidden sm:flex h-full relative z-10">
        <Sidebar
          userName={userRow.name ?? user.email?.split("@")[0] ?? "Usuario"}
          userEmail={userRow.email ?? user.email ?? ""}
          avatarUrl={userRow.avatar_url ?? null}
          workspaceName={workspace?.name ?? "Mi Tienda"}
          workspacePlan={plan}
          activeProviders={Array.from(activeProviders)}
          alertCount={alerts}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <Navbar
          userName={userRow.name ?? user.email?.split("@")[0] ?? "Usuario"}
          avatarUrl={userRow.avatar_url ?? null}
          alertCount={alerts}
        />
        <PinnedBar />
        {/* pb-16 en mobile para que no tape el BottomNav */}
        <main className="relative flex-1 overflow-y-auto pb-16 sm:pb-0">
          {isLocked ? (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "rgba(10,10,15,0.95)" }}>
              <PaywallCard
                workspaceId={workspace?.id ?? ""}
                userEmail={userRow.email ?? user.email ?? ""}
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
