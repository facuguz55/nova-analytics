"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Mail, Send, Sparkles, Loader2, Inbox, PenSquare,
  CheckCircle2, Copy, X, Search, RefreshCw, Circle, ExternalLink, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// ── Category helpers ───────────────────────────────────────────────────────

type MailCategory = "consulta" | "reclamo" | "pedido" | "agradecimiento" | "urgente" | "otro";

const CATEGORY_LABEL: Record<MailCategory, string> = {
  consulta: "Consulta",
  reclamo: "Reclamo",
  pedido: "Pedido",
  agradecimiento: "Gracias",
  urgente: "Urgente",
  otro: "Otro",
};

const CATEGORY_STYLE: Record<MailCategory, { color: string; bg: string; border: string }> = {
  consulta:       { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.25)" },
  reclamo:        { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)" },
  pedido:         { color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.25)" },
  agradecimiento: { color: "#86efac", bg: "rgba(134,239,172,0.08)", border: "rgba(134,239,172,0.2)" },
  urgente:        { color: "#fb923c", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.25)" },
  otro:           { color: "#64748b", bg: "rgba(100,116,139,0.06)", border: "rgba(100,116,139,0.12)" },
};

function CategoryBadge({ category, className = "" }: { category: MailCategory; className?: string }) {
  const s = CATEGORY_STYLE[category];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold flex-shrink-0 ${className}`}
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {CATEGORY_LABEL[category]}
    </span>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────

interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  isUnread: boolean;
  internalDate: string;
}

interface FullMessage extends EmailMessage {
  body: string;
  isHtml: boolean;
  messageId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Acepta emails separados por coma, punto y coma o salto de línea.
function parseRecipients(raw: string): { valid: string[]; invalid: string[] } {
  const tokens = raw.split(/[,;\n]/).map(t => t.trim()).filter(Boolean);
  const valid = [...new Set(tokens.filter(t => EMAIL_REGEX.test(t)))];
  const invalid = [...new Set(tokens.filter(t => !EMAIL_REGEX.test(t)))];
  return { valid, invalid };
}

function parseFrom(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*<(.+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: from, email: from };
}

function timeAgo(dateStr: string, internalDate: string): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date(parseInt(internalDate));
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `hace ${h}h`;
    const days = Math.floor(h / 24);
    if (days === 1) return "ayer";
    if (days < 7) return `hace ${days}d`;
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
}

function formatFecha(dateStr: string, internalDate: string): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date(parseInt(internalDate));
    return d.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  } catch { return dateStr; }
}

function formatHora(dateStr: string, internalDate: string): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date(parseInt(internalDate));
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

// ── Mail body parser ───────────────────────────────────────────────────────

interface MailSegment {
  type: "main" | "quote";
  header?: string;
  text: string;
}

function parseMailBody(cuerpo: string): MailSegment[] {
  const normalized = cuerpo.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const QUOTE_HEADER_RE = /^(El\s+.+escribi[oó][:：]|On\s+.+wrote[:：])\s*$/i;
  const QUOTE_LINE_RE = /^>\s*/;

  let quoteStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (QUOTE_HEADER_RE.test(trimmed)) { quoteStart = i; break; }
    if (QUOTE_LINE_RE.test(lines[i]) && i > 0) { quoteStart = i; break; }
  }

  if (quoteStart === -1) return [{ type: "main", text: normalized.trim() }];

  const segments: MailSegment[] = [];
  const mainText = lines.slice(0, quoteStart).join("\n").trimEnd();
  if (mainText) segments.push({ type: "main", text: mainText });

  const firstLine = lines[quoteStart].trim();
  const isHeader = QUOTE_HEADER_RE.test(firstLine);
  const contentStart = isHeader ? quoteStart + 1 : quoteStart;
  const quoteText = lines
    .slice(contentStart)
    .map(l => l.replace(QUOTE_LINE_RE, ""))
    .join("\n")
    .trim();

  segments.push({ type: "quote", header: isHeader ? firstLine : undefined, text: quoteText });
  return segments;
}

// Inyectamos un <style> en el HTML del email para que el iframe
// herede el fondo oscuro de la app. No tocamos colores de texto originales
// del email — solo fondo del <html>/<body> cuando es blanco/sin definir.
function wrapHtmlForDarkIframe(html: string): string {
  const darkStyle = `<style>
    :root { color-scheme: dark; }
    html, body {
      background: #111118 !important;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      padding: 8px !important;
      margin: 0 !important;
    }
    /* Solo aplicar color de texto si el elemento no tiene su propio color */
    body:not([style*="color"]) { color: #CBD5E1; }
    a { color: #a78bfa; }
    img { max-width: 100%; height: auto; }
  </style>`;

  // Insertar antes de </head> o al principio si no hay <head>
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${darkStyle}</head>`);
  }
  if (/<body/i.test(html)) {
    return html.replace(/<body/i, `${darkStyle}<body`);
  }
  return darkStyle + html;
}

function MailBody({ body, isHtml }: { body: string; isHtml: boolean }) {
  if (isHtml) {
    return (
      <iframe
        srcDoc={wrapHtmlForDarkIframe(body)}
        className="w-full rounded-xl"
        style={{ minHeight: "300px", border: "none", background: "#111118" }}
        sandbox=""
        // sandbox="" sin permisos — bloquea JS, cookies y acceso al DOM padre
        title="Email"
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          // Auto-resize al contenido real del email
          try {
            const iframe = e.currentTarget;
            const h = iframe.contentDocument?.body?.scrollHeight;
            if (h && h > 0) iframe.style.height = `${h + 32}px`;
          } catch { /* sandboxed */ }
        }}
      />
    );
  }

  const segments = parseMailBody(body);
  return (
    <div className="space-y-3">
      {segments.map((seg, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{
            background: seg.type === "main" ? "rgba(139,92,246,0.05)" : "rgba(255,255,255,0.02)",
            border: seg.type === "main" ? "1px solid rgba(139,92,246,0.15)" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {seg.header && (
            <p className="text-[10px] text-[#64748B] mb-2 italic">{seg.header}</p>
          )}
          <pre
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              color: "#CBD5E1",
              fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
              fontSize: "13.5px",
              lineHeight: "1.7",
            }}
          >
            {seg.text}
          </pre>
        </div>
      ))}
    </div>
  );
}

function MailSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-[rgba(139,92,246,0.07)]">
          <div className="flex justify-between mb-2">
            <div className="h-3 rounded bg-[rgba(255,255,255,0.06)] w-2/5 animate-pulse" />
            <div className="h-2.5 rounded bg-[rgba(255,255,255,0.04)] w-1/5 animate-pulse" />
          </div>
          <div className="h-2.5 rounded bg-[rgba(255,255,255,0.04)] w-4/5 animate-pulse" />
        </div>
      ))}
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function MailsClient({
  isConnected,
  gmailEmail,
  messages,
}: {
  isConnected: boolean;
  gmailEmail: string;
  messages: EmailMessage[];
}) {
  const [selected, setSelected] = useState<FullMessage | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNoReply, setAiNoReply] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "others">("all");
  const [atendidos, setAtendidos] = useState<Set<string>>(new Set());
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());
  const [classifications, setClassifications] = useState<Record<string, MailCategory>>({});
  const [classifying, setClassifying] = useState(true);

  // ── Redactar / envío masivo ──────────────────────────────────────────────
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [composeResults, setComposeResults] = useState<{ email: string; status: "ok" | "error" }[] | null>(null);

  function openCompose() {
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setComposeResults(null);
    setShowCompose(true);
  }

  const { valid: composeValidRecipients, invalid: composeInvalidRecipients } = parseRecipients(composeTo);

  async function handleComposeSend() {
    if (composeValidRecipients.length === 0) { toast.error("Poné al menos un email válido"); return; }
    if (!composeSubject.trim()) { toast.error("Poné un asunto"); return; }
    if (!composeBody.trim()) { toast.error("Escribí un mensaje"); return; }

    setComposeSending(true);
    setComposeResults(null);
    const results: { email: string; status: "ok" | "error" }[] = [];

    // Secuencial — un email real por destinatario, no CC ni grupo.
    for (const email of composeValidRecipients) {
      try {
        const res = await fetch("/api/mails/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: email, subject: composeSubject, body: composeBody }),
        });
        results.push({ email, status: res.ok ? "ok" : "error" });
      } catch {
        results.push({ email, status: "error" });
      }
    }

    setComposeResults(results);
    setComposeSending(false);

    const okCount = results.filter(r => r.status === "ok").length;
    if (okCount === results.length) {
      toast.success(results.length === 1 ? "Mail enviado correctamente" : `${okCount} mails enviados correctamente`);
      setComposeTo(""); setComposeSubject(""); setComposeBody("");
    } else if (okCount === 0) {
      toast.error("No se pudo enviar ningún mail");
    } else {
      toast.warning(`${okCount} de ${results.length} enviados — revisá los que fallaron`);
    }
  }

  // Clasificar todos los emails al montar (un solo call batch a Haiku)
  useEffect(() => {
    if (!messages.length) { setClassifying(false); return; }
    const payload = messages.map(m => ({
      id: m.id,
      from: m.from,
      subject: m.subject,
      snippet: m.snippet,
    }));
    fetch("/api/mails/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payload }),
    })
      .then(r => r.ok ? r.json() : null)
      .then((data: { classifications: Array<{ id: string; category: MailCategory }> } | null) => {
        if (!data) return;
        const map: Record<string, MailCategory> = {};
        for (const c of data.classifications) map[c.id] = c.category;
        setClassifications(map);
      })
      .catch(() => { /* clasificación es best-effort */ })
      .finally(() => setClassifying(false));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAISuggestion(msg: FullMessage) {
    setAiLoading(true);
    setAiSuggestion("");
    setAiNoReply(null);
    try {
      const res = await fetch("/api/mails/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: msg.from,
          subject: msg.subject,
          body: msg.body || msg.snippet,
        }),
      });
      if (res.status === 422) {
        const data = await res.json() as { message?: string };
        setAiNoReply(data.message ?? "Este email no admite respuesta automática.");
        return;
      }
      const data = await res.json() as { suggestion?: string };
      if (data.suggestion) setAiSuggestion(data.suggestion);
    } catch { /* silencioso — el usuario puede regenerar manualmente */ }
    finally { setAiLoading(false); }
  }

  const selectMessage = useCallback(async (msg: EmailMessage) => {
    if (loadingId) return;
    setLoadingId(msg.id);
    setReplyBody("");
    setAiSuggestion("");
    setAiNoReply(null);
    setAiLoading(true);
    setLocalRead(prev => new Set([...prev, msg.id]));
    try {
      const res = await fetch(`/api/mails/message?id=${msg.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as FullMessage;
      const fullMsg = { ...msg, ...data };
      setSelected(fullMsg);
      fetchAISuggestion(fullMsg);
    } catch {
      toast.error("No se pudo cargar el email");
      setAiLoading(false);
    } finally {
      setLoadingId(null);
    }
  }, [loadingId]);  // eslint-disable-line react-hooks/exhaustive-deps

  function handleAISuggest() {
    if (selected) fetchAISuggestion(selected);
  }

  async function handleSend() {
    if (!selected || !replyBody.trim()) { toast.error("Escribí algo antes de enviar"); return; }
    setSending(true);
    try {
      const { email: toEmail } = parseFrom(selected.from);
      const res = await fetch("/api/mails/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toEmail,
          subject: selected.subject,
          body: replyBody,
          threadId: selected.threadId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("¡Respuesta enviada correctamente!");
      setReplyBody("");
      setAiSuggestion("");
      setAtendidos(prev => new Set([...prev, selected.id]));
    } catch {
      toast.error("No se pudo enviar. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(234,67,53,0.12)" }}>
          <Mail size={28} color="#EA4335" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#F1F5F9]">Gmail no conectado</h2>
          <p className="text-sm text-[#94A3B8] mt-1 max-w-xs">
            Conectá tu cuenta de Gmail para gestionar emails desde Nova Analytics.
          </p>
        </div>
        <a
          href="/api/auth/gmail"
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #EA4335, #FBBC04)" }}
        >
          <Mail size={15} strokeWidth={2.5} /> Conectar Gmail
        </a>
      </div>
    );
  }

  const classifiedLoaded = Object.keys(classifications).length > 0;
  const isClient = (id: string) => !classifiedLoaded || classifications[id] !== "otro";

  const clientMessages = messages.filter(m => isClient(m.id));
  const othersMessages = messages.filter(m => classifiedLoaded && classifications[m.id] === "otro");
  const unreadCount = clientMessages.filter(m => m.isUnread && !localRead.has(m.id)).length;

  const baseFiltered =
    filter === "unread"  ? clientMessages.filter(m => m.isUnread && !localRead.has(m.id)) :
    filter === "others"  ? othersMessages :
    clientMessages;

  const filtered = search.trim()
    ? baseFiltered.filter(m => {
        const q = search.toLowerCase();
        const { name } = parseFrom(m.from);
        return name.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q) || m.snippet.toLowerCase().includes(q);
      })
    : baseFiltered;

  return (
    <div className="flex flex-col sm:flex-row" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── PANEL IZQUIERDO ─────────────────────────────────────────────── */}
      <div
        className={`flex-col flex-shrink-0 ${selected ? "hidden sm:flex" : "flex"} sm:w-[300px] w-full`}
        style={{ borderRight: "1px solid rgba(139,92,246,0.12)" }}
      >
        {/* Header */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-sm font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.01em" }}>
                Bandeja de entrada
              </h1>
              {gmailEmail && <p className="text-[10px] text-[#64748B]">{gmailEmail}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={openCompose}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
                style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
                title="Redactar mail"
              >
                <PenSquare size={12} strokeWidth={2.5} />
              </button>
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
                style={{ background: "rgba(234,67,53,0.1)", color: "#EA4335" }}
                title="Abrir Gmail"
              >
                <ExternalLink size={12} strokeWidth={2.5} />
              </a>
              <button
                onClick={() => window.location.reload()}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
                style={{ background: "rgba(139,92,246,0.08)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
                title="Actualizar"
              >
                <RefreshCw size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="px-3 py-2 flex-shrink-0">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2.5 text-[#475569] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-7 pr-7 py-1.5 rounded-lg text-xs text-[#F1F5F9] placeholder:text-[#475569] outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.15)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 text-[#64748B] hover:text-[#94A3B8]">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="px-3 pb-2 flex gap-1.5 flex-shrink-0 flex-wrap">
          {([
            { key: "all",    label: classifying ? `Clientes…` : `Clientes (${clientMessages.length})` },
            { key: "unread", label: `No leídos (${unreadCount})` },
            { key: "others", label: classifying ? `Otros…`    : `Otros (${othersMessages.length})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${classifying && key !== "unread" ? "animate-pulse" : ""}`}
              style={{
                background: filter === key ? "#8b5cf6" : "transparent",
                color: filter === key ? "white" : "#94A3B8",
                border: `1px solid ${filter === key ? "#8b5cf6" : "rgba(139,92,246,0.2)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto divide-y divide-[rgba(139,92,246,0.07)]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.08)" }}>
                <Inbox size={18} color="#8b5cf6" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-[#64748B]">Tu bandeja está vacía</p>
            </div>
          )}
          {filtered.length === 0 && messages.length > 0 && (
            <div className="px-4 py-8 text-center text-xs text-[#64748B]">Sin resultados</div>
          )}
          {filtered.map(msg => {
            const { name } = parseFrom(msg.from);
            const isActive = selected?.id === msg.id;
            const isUnread = msg.isUnread && !localRead.has(msg.id);
            return (
              <button
                key={msg.id}
                onClick={() => selectMessage(msg)}
                disabled={!!loadingId}
                className="w-full text-left px-4 py-3 transition-colors hover:bg-[rgba(139,92,246,0.06)] disabled:opacity-60"
                style={{
                  background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
                  borderLeft: isActive ? "2px solid #8b5cf6" : "2px solid transparent",
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {isUnread
                      ? <Circle size={6} fill="#8b5cf6" color="#8b5cf6" className="flex-shrink-0" />
                      : <div className="w-[6px] flex-shrink-0" />
                    }
                    <span
                      className="text-xs truncate"
                      style={{ color: isUnread ? "#F1F5F9" : "#94A3B8", fontWeight: isUnread ? 600 : 400 }}
                    >
                      {name}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#475569] flex-shrink-0">
                    {timeAgo(msg.date, msg.internalDate)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-0.5 pl-[14px]">
                  <p className="text-[11px] text-[#94A3B8] truncate flex-1">{msg.subject}</p>
                  {classifications[msg.id] && (
                    <CategoryBadge category={classifications[msg.id]} />
                  )}
                  {atendidos.has(msg.id) && (
                    <span
                      className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                      style={{ color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                    >
                      <CheckCircle2 size={8} strokeWidth={2.5} /> Atendido
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-[#64748B] truncate pl-[14px]">{msg.snippet}</p>

                {loadingId === msg.id && (
                  <div className="mt-1 flex justify-end">
                    <Loader2 size={10} className="animate-spin text-[#8b5cf6]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PANEL DERECHO ─────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${!selected ? "hidden sm:flex" : "flex"}`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
              <Inbox size={20} color="#8b5cf6" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#94A3B8]">Seleccioná un mail</p>
              <p className="text-xs text-[#64748B] mt-1">Leé, respondé y usá IA para redactar</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">

            {/* Header */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
              <button
                onClick={() => setSelected(null)}
                className="flex sm:hidden items-center gap-1.5 text-xs text-[#64748B] mb-3 hover:text-[#94A3B8]"
              >
                ← Volver
              </button>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-[#F1F5F9] text-base truncate">{selected.subject}</h2>
                    {classifications[selected.id] && (
                      <CategoryBadge category={classifications[selected.id]} />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#a78bfa] mt-0.5">{parseFrom(selected.from).name}</p>
                  <p className="text-[11px] text-[#64748B]">{parseFrom(selected.from).email}</p>
                  <p className="text-[11px] text-[#475569] mt-0.5">
                    {formatFecha(selected.date, selected.internalDate)} · {formatHora(selected.date, selected.internalDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`https://mail.google.com/mail/u/0/#inbox/${selected.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#64748B] hover:text-[#94A3B8] transition-colors p-1"
                    title="Ver en Gmail"
                  >
                    <ExternalLink size={14} strokeWidth={2} />
                  </a>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-[#64748B] hover:text-[#94A3B8] transition-colors p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Cuerpo scrolleable */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6 min-h-0">

              {/* Body */}
              <MailBody body={selected.body || selected.snippet} isHtml={selected.isHtml} />

              <div style={{ borderTop: "1px solid rgba(139,92,246,0.12)" }} />

              {/* Sugerencia IA */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} color="#a78bfa" strokeWidth={2.5} />
                    <span className="text-[10px] font-semibold tracking-widest text-[#a78bfa] uppercase">
                      Respuesta sugerida por IA
                    </span>
                  </div>
                  <button
                    onClick={handleAISuggest}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}
                  >
                    {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} strokeWidth={2.5} />}
                    {aiLoading ? "Generando..." : "Regenerar"}
                  </button>
                </div>

                {aiNoReply ? (
                  <div
                    className="w-full rounded-xl px-4 py-3 text-sm flex items-start gap-2.5"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}
                  >
                    <X size={14} color="#ef4444" strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#ef4444] mb-0.5">No se generó sugerencia</p>
                      <p className="text-xs text-[#f87171] leading-relaxed">{aiNoReply}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full rounded-xl px-4 py-3 text-sm min-h-[48px]"
                    style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", color: aiSuggestion ? "#94A3B8" : "#475569" }}
                  >
                    {aiLoading
                      ? <span className="italic text-xs text-[#64748B]">Generando sugerencia...</span>
                      : aiSuggestion || <span className="italic text-xs">La sugerencia aparecerá acá...</span>
                    }
                  </div>
                )}

                {aiSuggestion && (
                  <button
                    onClick={() => { setReplyBody(aiSuggestion); toast.success("Sugerencia copiada"); }}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(139,92,246,0.08)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
                  >
                    <Copy size={11} strokeWidth={2.5} /> Usar sugerencia
                  </button>
                )}
              </div>

              <div style={{ borderTop: "1px solid rgba(139,92,246,0.12)" }} />

              {/* Tu respuesta */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Send size={12} color="#94A3B8" strokeWidth={2} />
                  <span className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Tu respuesta</span>
                </div>
                <p className="text-[11px] text-[#475569] mb-2">Re: {selected.subject}</p>
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder="Escribí tu respuesta acá..."
                  rows={5}
                  className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none resize-none"
                  style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !replyBody.trim()}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)" }}
                >
                  {sending
                    ? <><RefreshCw size={14} className="animate-spin" /> Enviando...</>
                    : <><Send size={14} strokeWidth={2.5} /> Enviar respuesta</>}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: Redactar / envío masivo ─────────────────────────────────── */}
      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !composeSending) setShowCompose(false); }}
        >
          <div
            className="rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <PenSquare size={18} color="#a78bfa" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F1F5F9]">Redactar mail</h3>
                  <p className="text-[11px] text-[#64748B]">Poné uno o varios destinatarios para enviar el mismo mensaje a cada uno</p>
                </div>
              </div>
              <button
                onClick={() => !composeSending && setShowCompose(false)}
                className="text-[#64748B] hover:text-[#F1F5F9] transition-colors flex-shrink-0"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Para</label>
                <textarea
                  value={composeTo}
                  onChange={e => setComposeTo(e.target.value)}
                  placeholder="cliente@ejemplo.com, otro@ejemplo.com&#10;(uno por línea o separados por coma)"
                  rows={2}
                  className="w-full mt-1.5 rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none resize-none"
                  style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
                />
                {composeTo.trim() && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {composeValidRecipients.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)" }}>
                        {composeValidRecipients.length} destinatario{composeValidRecipients.length > 1 ? "s" : ""} válido{composeValidRecipients.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {composeInvalidRecipients.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)" }}>
                        <AlertTriangle size={9} strokeWidth={2.5} /> ignorado: {composeInvalidRecipients.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Asunto</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Ej: Actualización sobre tu pedido"
                  className="w-full mt-1.5 rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none"
                  style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Mensaje</label>
                <textarea
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Escribí tu mensaje acá..."
                  rows={6}
                  className="w-full mt-1.5 rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] outline-none resize-none"
                  style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
                />
              </div>
            </div>

            {composeResults && (
              <div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {composeResults.map(r => (
                  <div key={r.email} className="flex items-center gap-2 text-xs">
                    {r.status === "ok"
                      ? <CheckCircle2 size={12} color="#22c55e" strokeWidth={2.5} className="flex-shrink-0" />
                      : <X size={12} color="#ef4444" strokeWidth={2.5} className="flex-shrink-0" />}
                    <span style={{ color: r.status === "ok" ? "#94A3B8" : "#f87171" }}>{r.email}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompose(false)}
                disabled={composeSending}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-[#64748B] transition-all hover:text-[#F1F5F9] disabled:opacity-50"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}
              >
                Cerrar
              </button>
              <button
                onClick={handleComposeSend}
                disabled={composeSending || composeValidRecipients.length === 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)" }}
              >
                {composeSending
                  ? <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                  : <><Send size={14} strokeWidth={2.5} /> Enviar{composeValidRecipients.length > 1 ? ` a ${composeValidRecipients.length}` : ""}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
