import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNovaLocalClient } from "@/lib/supabase/nova-local";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!process.env.NOVA_LOCAL_SUPABASE_URL) {
    return NextResponse.json({ linked: false, sales: [], products: [], costs: {} });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "90", 10);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  try {
    const local = createNovaLocalClient();

    // Auto-detectar tienda: buscar en Nova Local un usuario con el mismo email verificado
    if (!user.email_confirmed_at) {
      return NextResponse.json({ linked: false, sales: [], products: [], costs: {} });
    }

    const { data: { users: localUsers } } = await local.auth.admin.listUsers();
    const normalizedEmail = user.email!.toLowerCase().trim();
    const matchedUser = localUsers.find(
      (u) => u.email?.toLowerCase().trim() === normalizedEmail && u.email_confirmed_at
    );

    let tiendaId: string | null = null;

    if (matchedUser) {
      const { data: tienda } = await local
        .from("tiendas")
        .select("id")
        .eq("owner_id", matchedUser.id)
        .limit(1)
        .single();
      tiendaId = tienda?.id ?? null;
    }

    if (!tiendaId) {
      return NextResponse.json({ linked: false, sales: [], products: [], costs: {} });
    }

    const [salesResult, productsResult, costsFijosResult, costosVarResult] = await Promise.all([
      local
        .from("local_ventas")
        .select("id, total, created_at, medio_pago, cancelada")
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
