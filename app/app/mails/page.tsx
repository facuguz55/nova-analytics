import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import MailsClient from "./MailsClient";

export const metadata: Metadata = { title: "Mails" };

interface MailRow {
  id: string;
  thread_id: string;
  de: string;
  nombre: string;
  asunto: string;
  cuerpo: string;
  fecha: string;
  leido: boolean;
  categoria: string;
  resumen: string;
  respuesta_sugerida: string;
  respondido: boolean;
}

export default async function MailsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const service = createServiceClient();

  // Obtener workspace_id
  const { data: userRow } = user
    ? await service.from("users").select("workspace_id").eq("id", user.id).single()
    : { data: null };
  const workspaceId = (userRow as { workspace_id: string } | null)?.workspace_id;

  // Verificar si Gmail está conectado
  const { data: gmailRaw } = workspaceId
    ? await service
        .from("integrations")
        .select("status, metadata")
        .eq("workspace_id", workspaceId)
        .eq("provider", "gmail")
        .maybeSingle()
    : { data: null };

  const gmail = gmailRaw as { status: string; metadata: { email?: string } | null } | null;
  const isConnected = gmail?.status === "active";
  const gmailEmail = gmail?.metadata?.email ?? "";

  // Cargar mails desde la DB
  const { data: rawMails } = workspaceId && isConnected
    ? await service
        .from("mails")
        .select("id, thread_id, de, nombre, asunto, cuerpo, fecha, leido, categoria, resumen, respuesta_sugerida, respondido")
        .eq("workspace_id", workspaceId)
        .order("fecha", { ascending: false })
        .limit(50)
    : { data: [] };

  const mails = ((rawMails ?? []) as unknown as MailRow[]).map((r) => ({
    id: r.id,
    threadId: r.thread_id,
    de: r.de ?? "",
    nombre: r.nombre ?? "",
    asunto: r.asunto ?? "(Sin asunto)",
    cuerpo: r.cuerpo ?? "",
    fecha: r.fecha ?? new Date().toISOString(),
    leido: r.leido ?? false,
    categoria: r.categoria ?? "info",
    resumen: r.resumen ?? "",
    respuestaSugerida: r.respuesta_sugerida ?? "",
    respondido: r.respondido ?? false,
  }));

  return (
    <MailsClient
      isConnected={isConnected}
      gmailEmail={gmailEmail}
      mails={mails}
    />
  );
}
