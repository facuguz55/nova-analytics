import { NextResponse } from "next/server";

/**
 * DEPRECATED - Esta ruta ya no guarda emails en Supabase.
 * Los emails se cargan DIRECTO desde Gmail API con maxResults=20.
 * Ver: /app/app/mails/page.tsx
 */
export async function POST() {
  return NextResponse.json(
    { error: "Sync de emails a base de datos deshabilitado. Los emails se cargan directo desde Gmail API." },
    { status: 410 }
  );
}
