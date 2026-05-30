import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ConfiguracionClient from "./ConfiguracionClient";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  type UserRow = { name: string | null; email: string; avatar_url: string | null; role: string; workspaces: { name: string; plan: string } | null };
  const { data: rawUserRow } = await supabase
    .from("users")
    .select("name, email, avatar_url, role, workspaces(name, plan)")
    .eq("id", user.id)
    .single();
  const userRow = rawUserRow as unknown as UserRow | null;

  const identities = ((user as unknown) as { identities?: Array<{ provider: string }> }).identities ?? [];
  const providers: string[] = identities.map((i) => i.provider).filter(Boolean);
  const isOAuthUser = providers.length > 0 && providers.every((p) => p !== "email");

  return (
    <ConfiguracionClient
      user={{
        email: userRow?.email ?? user.email ?? "",
        name: userRow?.name ?? "",
        isOAuthUser,
        authProvider: providers[0] ?? "email",
        plan: userRow?.workspaces?.plan ?? "free",
      }}
    />
  );
}
