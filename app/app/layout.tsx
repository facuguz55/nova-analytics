import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

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

  const [{ data: rawUserRow }, { data: rawIntegrations }] = await Promise.all([
    supabase.from("users").select("*, workspaces(id, name, plan, status)").eq("id", user.id).single(),
    supabase.from("integrations").select("provider, status").eq("status", "active"),
  ]);

  const userRow = rawUserRow as unknown as UserRow | null;
  const integrations = (rawIntegrations ?? []) as unknown as IntRow[];
  const workspace = userRow?.workspaces ?? null;

  const activeProviders = new Set(integrations.map((i) => i.provider));

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      <Sidebar
        userName={userRow?.name ?? user.email?.split("@")[0] ?? "Usuario"}
        userEmail={userRow?.email ?? user.email ?? ""}
        avatarUrl={userRow?.avatar_url ?? null}
        workspaceName={workspace?.name ?? "Mi Tienda"}
        workspacePlan={workspace?.plan ?? "free"}
        activeProviders={Array.from(activeProviders)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          userName={userRow?.name ?? user.email?.split("@")[0] ?? "Usuario"}
          avatarUrl={userRow?.avatar_url ?? null}
        />
        <main className="flex-1 overflow-y-auto bg-[#0a0a0f]">
          {children}
        </main>
      </div>
    </div>
  );
}
