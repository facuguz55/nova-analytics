import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNovaLocalClient } from "@/lib/supabase/nova-local";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "90", 10);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data: rawUserRow } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  const userRow = rawUserRow as { workspace_id: string } | null;
  if (!userRow?.workspace_id) {
    return NextResponse.json({ error: "Sin workspace" }, { status: 400 });
  }

  const { data: rawIntegration } = await supabase
    .from("integrations")
    .select("config")
    .eq("workspace_id", userRow.workspace_id)
    .eq("provider", "nova_local")
    .single();

  const integration = rawIntegration as { config: Record<string, unknown> } | null;
  const tiendaId = (integration?.config?.tienda_id as string) ?? null;
  if (!tiendaId) {
    return NextResponse.json({ linked: false, sales: [], products: [], costs: {} });
  }

  try {
    const local = createNovaLocalClient();

    const [salesResult, productsResult, costsFijosResult, costosVarResult] = await Promise.all([
      local
        .from("local_ventas")
        .select(`
          id, total, created_at, medio_pago, cancelada,
          grupo:local_venta_grupo!inner(id)
        `)
        .eq("tienda_id", tiendaId)
        .eq("cancelada", false)
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
      local
        .from("local_modelos")
        .select("id, marca, modelo, costo, precio")
        .eq("tienda_id", tiendaId),
      local
        .from("local_costos_extra")
        .select("nombre, monto")
        .eq("tienda_id", tiendaId),
      local
        .from("local_costos_variables")
        .select("nombre, porcentaje, aplica_a")
        .eq("tienda_id", tiendaId),
    ]);

    const sales = (salesResult.data ?? []).map((s) => ({
      id: s.id,
      total: Number(s.total),
      created_at: s.created_at,
      medio_pago: s.medio_pago,
    }));

    const products = (productsResult.data ?? []).map((p) => ({
      id: p.id,
      name: `${p.marca} ${p.modelo}`.trim(),
      cost: Number(p.costo),
      price: Number(p.precio),
    }));

    const fixedCosts = (costsFijosResult.data ?? []).reduce(
      (sum, c) => sum + Number(c.monto),
      0
    );

    const variablePct = (costosVarResult.data ?? []).reduce(
      (sum, c) => sum + Number(c.porcentaje),
      0
    );

    return NextResponse.json({
      linked: true,
      sales,
      products,
      costs: { fixedMonthly: fixedCosts, variablePct },
    });
  } catch {
    return NextResponse.json(
      { error: "Error conectando con Nova Local" },
      { status: 500 }
    );
  }
}
