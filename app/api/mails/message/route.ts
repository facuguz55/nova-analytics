import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailToken } from "@/lib/google/gmail";

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

function decodeB64(str: string) {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractBody(payload: GmailPart): { text: string; html: string } {
  if (!payload) return { text: "", html: "" };
  const mime = payload.mimeType ?? "";

  if (mime === "text/plain" && payload.body?.data)
    return { text: decodeB64(payload.body.data), html: "" };

  if (mime === "text/html" && payload.body?.data)
    return { text: "", html: decodeB64(payload.body.data) };

  if (payload.parts) {
    let text = "", html = "";
    for (const part of payload.parts) {
      const sub = extractBody(part);
      if (sub.html) html = sub.html;
      else if (sub.text) text = sub.text;
    }
    return { text, html };
  }
  return { text: "", html: "" };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("id");
  if (!messageId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Gmail message IDs son [a-zA-Z0-9_-]+ — sin validar, valores con / ? .. permiten
  // manipular el path/query de la URL de Gmail.
  if (!/^[a-zA-Z0-9_-]+$/.test(messageId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rawUser } = await supabase
    .from("users").select("workspace_id").eq("id", user.id).single();
  const workspaceId = (rawUser as { workspace_id: string | null } | null)?.workspace_id;
  if (!workspaceId) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const gmail = await getGmailToken(workspaceId);
  if (!gmail) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${gmail.accessToken}` } }
  );

  if (!res.ok) return NextResponse.json({ error: "Gmail API error" }, { status: res.status });

  const msg = await res.json() as {
    id: string; threadId: string; snippet: string;
    payload: GmailPart & { headers: { name: string; value: string }[] };
  };

  const { text, html } = extractBody(msg.payload);
  const getHeader = (name: string) =>
    msg.payload.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  return NextResponse.json({
    id: msg.id,
    threadId: msg.threadId,
    messageId: getHeader("message-id"),
    from: getHeader("from"),
    to: getHeader("to"),
    subject: getHeader("subject"),
    date: getHeader("date"),
    body: html || text,
    isHtml: !!html,
    snippet: msg.snippet,
  });
}
