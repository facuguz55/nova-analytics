import { NextResponse } from "next/server";

/**
 * DEPRECATED - Esta ruta ya no guarda datos en Supabase.
 * Los datos de TiendaNube se cargan DIRECTO desde la API en cada request.
 * Ver: /lib/tiendanube/client.ts y /lib/tiendanube/connection.ts
 */
export async function POST() {
  return NextResponse.json(
    { error: "Sync a base de datos deshabilitado. Los datos se cargan directo desde TiendaNube API." },
    { status: 410 }
  );
}
