import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";

// Ruta temporaria de diagnóstico — ver qué campos devuelve TiendaNube en variantes
// Solo accesible para super_admin
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).single();
  if ((userRow as any)?.role !== "super_admin") {
    return NextResponse.json({ error: "Solo super_admin" }, { status: 403 });
  }

  const connection = await getTiendaNubeConnection();
  if (!connection) return NextResponse.json({ error: "TiendaNube no conectado" });

  const res = await fetch(
    `https://api.tiendanube.com/v1/${connection.opts.storeId}/products?per_page=3&page=1`,
    {
      headers: {
        Authentication: `bearer ${connection.opts.accessToken}`,
        "User-Agent": "Nova Analytics (novaagency.info)",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: `TN error ${res.status}`, body: await res.text() });
  }

  const products = await res.json();

  // Devolver solo los primeros 3 productos con sus variantes raw
  return NextResponse.json({
    total_fetched: products.length,
    // Primer producto completo para ver todos los campos
    first_product_raw: products[0] ?? null,
    // Resumen de variantes de los 3 productos
    variants_summary: products.slice(0, 3).map((p: any) => ({
      product_id: p.id,
      product_name: p.name?.es ?? p.name,
      variants: p.variants?.map((v: any) => ({
        id: v.id,
        price: v.price,
        cost_price: v.cost_price,
        // Mostrar TODOS los campos del objeto variant para detectar nombre alternativo
        all_keys: Object.keys(v),
        all_values: v,
      })),
    })),
  });
}
