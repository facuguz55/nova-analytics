import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import LocalEmbedClient from "./LocalEmbedClient";

export const metadata: Metadata = { title: "Nova Local" };

export default async function LocalPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("workspace_id, workspaces(plan)")
    .eq("id", user.id)
    .single();

  const row = userRow as { workspace_id: string; workspaces: { plan: string } } | null;
  const plan = row?.workspaces?.plan ?? "free";

  if (plan !== "pro" && plan !== "agency") {
    return <LocalUpsell />;
  }

  return <LocalEmbedClient />;
}

function LocalUpsell() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div
        className="rounded-2xl p-8 max-w-md w-full text-center"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(225,105,30,0.12)" }}
        >
          <span className="text-3xl">🏪</span>
        </div>
        <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">Nova Local</h2>
        <p className="text-[#94A3B8] text-sm mb-6">
          Gestioná tu local físico con punto de venta, stock con variantes, caja, sucursales y más. Disponible en plan Pro.
        </p>
        <a
          href="/app/planes"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #e1691e, #a855f7)" }}
        >
          Ver planes
        </a>
      </div>
    </div>
  );
}
