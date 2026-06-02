import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CuentaClient from "./CuentaClient";

export const metadata: Metadata = { title: "Mi Cuenta" };

export default async function CuentaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  type UserRow = { id: string; email: string; name: string | null; avatar_url: string | null; role: string; created_at: string; workspace_id: string | null; workspaces: { id: string; name: string; plan: string; status: string } | null };
  const { data: rawUserRow } = await supabase
    .from("users")
    .select("*, workspaces(id, name, plan, status)")
    .eq("id", user.id)
    .single();
  const userRow = rawUserRow as unknown as UserRow | null;
  const workspace = userRow?.workspaces ?? null;
  const workspaceId = workspace?.id ?? userRow?.workspace_id ?? "";

  // Detectar proveedor de auth (google, github, email, etc.)
  // Si tiene identities con provider != "email", es OAuth y no puede cambiar password local.
  const identities = (user as any).identities ?? [];
  const providers: string[] = identities.map((i: any) => i.provider).filter(Boolean);
  const isOAuthUser = providers.length > 0 && providers.every((p) => p !== "email");
  const authProvider = providers[0] ?? "email";

  return (
    <CuentaClient
      user={{
        id: user.id,
        email: userRow?.email ?? user.email ?? "",
        name: userRow?.name ?? "",
        avatar_url: userRow?.avatar_url ?? null,
        role: userRow?.role ?? "user",
        created_at: userRow?.created_at ?? user.created_at ?? "",
        authProvider,
        isOAuthUser,
      }}
      workspaceId={workspaceId}
      workspace={workspace ? {
        name: workspace.name,
        plan: workspace.plan,
        status: workspace.status,
      } : null}
    />
  );
}
