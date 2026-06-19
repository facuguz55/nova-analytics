import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/cached-queries";
import { getTNConnectionForWorkspace } from "@/lib/tiendanube/hq-connection";
import { getCustomers } from "@/lib/tiendanube/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((userRow as { role: string } | null)?.role !== "super_admin") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const tnConn = await getTNConnectionForWorkspace(workspaceId);
  if (!tnConn) {
    return NextResponse.json({ customers: [], hasTN: false });
  }

  try {
    const customers = await getCustomers(tnConn.opts, 1, 200);
    return NextResponse.json({ customers, hasTN: true });
  } catch (e) {
    console.error("[admin/tn-customers] error:", e);
    return NextResponse.json(
      { customers: [], hasTN: true, error: "Error al consultar TiendaNube" },
      { status: 200 }
    );
  }
}
