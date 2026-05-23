import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CuentaClient from "./CuentaClient";

export const metadata: Metadata = { title: "Mi Cuenta" };

export default async function CuentaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  type UserRow = { id: string; email: string; name: string | null; avatar_url: string | null; role: string; created_at: string; workspaces: { name: string; plan: string; status: string } | null };
  const { data: rawUserRow } = await supabase
    .from("users")
    .select("*, workspaces(name, plan, status)")
    .eq("id", user.id)
    .single();
  const userRow = rawUserRow as unknown as UserRow | null;
  const workspace = userRow?.workspaces ?? null;

  return (
    <CuentaClient
      user={{
        id: user.id,
        email: userRow?.email ?? user.email ?? "",
        name: userRow?.name ?? "",
        avatar_url: userRow?.avatar_url ?? null,
        role: userRow?.role ?? "user",
        created_at: userRow?.created_at ?? user.created_at ?? "",
      }}
      workspace={workspace ? {
        name: workspace.name,
        plan: workspace.plan,
        status: workspace.status,
      } : null}
    />
  );
}
