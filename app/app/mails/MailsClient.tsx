"use client";

import { useState, useCallback } from "react";
import { Mail, ExternalLink, Circle, RefreshCw, Send, Sparkles, Loader2, X, Reply, ChevronDown } from "lucide-react";
import { toast } from "sonner";

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

function parseFrom(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*<(.+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: from, email: from };
}

function formatDate(dateStr: string, internalDate: string) {
  try {
    const d = dateStr ? new Date(dateStr) : new Date(parseInt(internalDate));
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch { return ""; }
}

export default function MailsClient({
  isConnected, gmailEmail, messages,
}: {
  isConnected: boolean;
  gmailEmail: string;
  messages: EmailMessage[];
}) {
  const [selected, setSelected] = useState<FullMessage | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const selectMessage = useCallback(async (msg: EmailMessage) => {
    if (loadingId) return;
    setLoadingId(msg.id);
    setShowReply(false);
    setReplyBody("");
    try {
      const res = await fetch(`/api/mails/message?id=${msg.id}`);
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json() as FullMessage;
      setSelected({ ...msg, ...data });
    } catch {
      toast.error("No se pudo cargar el email");
    } finally {
      setLoadingId(null);
    }
  }, [loadingId]);

  async function handleAISuggest() {
    if (!selected) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/mails/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: selected.from,
          subject: selected.subject,
          body: selected.body || selected.snippet,
        }),
      });
      const data = await res.json() as { suggestion?: string; error?: string };
      if (data.suggestion) {
        setReplyBody(data.suggestion);
        toast.success("Sugerencia IA lista");
      } else {
        toast.error("No se pudo generar sugerencia");
      }
    } catch {
      toast.error("Error al generar sugerencia");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSendReply() {
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
          inReplyTo: selected.messageId,
        }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      toast.success("Email enviado");
      setShowReply(false);
      setReplyBody("");
    } catch {
      toast.error("No se pudo enviar el email");
    } finally {
      setSending(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(234,67,53,0.12)" }}>
          <Mail size={28} color="#EA4335" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#F1F5F9]">Gmail no conectado</h2>
          <p className="text-sm text-[#94A3B8] mt-1 max-w-xs">
            Conectá tu cuenta de Gmail para acceder a tu bandeja de entrada desde Nova Analytics.
          </p>
        </div>
        <a
          href="/api/auth/gmail"
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #EA4335, #FBBC04)" }}
        >
          <Mail size={15} strokeWidth={2.5} />
          Conectar Gmail
        </a>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => m.isUnread).length;
  const filtered = filter === "unread" ? messages.filter((m) => m.isUnread) : messages;

  return (
    <div className="flex flex-col h-full p-4 gap-4" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Mails</h1>
          {gmailEmail && <p className="text-xs text-[#94A3B8]">{gmailEmail}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center rounded-xl p-1 gap-1"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: filter === f ? "#7C3AED" : "transparent",
                  color: filter === f ? "white" : "#94A3B8",
                }}
              >
                {f === "all" ? `Todos (${messages.length})` : `No leídos (${unreadCount})`}
              </button>
            ))}
          </div>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(234,67,53,0.1)", color: "#EA4335", border: "1px solid rgba(234,67,53,0.25)" }}
          >
            <ExternalLink size={12} strokeWidth={2.5} /> Gmail
          </a>
          <button
            onClick={() => window.location.reload()}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#94A3B8" }}
          >
            <RefreshCw size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Lista */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden flex-shrink-0"
          style={{ width: "300px", background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
            <p className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">
              Bandeja de entrada
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(124,58,237,0.07)]">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#64748B]">Sin mensajes</div>
            ) : filtered.map((msg) => {
              const { name } = parseFrom(msg.from);
              const isSelected = selected?.id === msg.id;
              const isLoading = loadingId === msg.id;
              return (
                <button
                  key={msg.id}
                  onClick={() => selectMessage(msg)}
                  disabled={!!loadingId}
                  className="w-full text-left px-4 py-3 transition-colors hover:bg-[rgba(124,58,237,0.06)] disabled:opacity-60"
                  style={{ background: isSelected ? "rgba(124,58,237,0.1)" : "transparent" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {msg.isUnread
                        ? <Circle size={7} fill="#7C3AED" color="#7C3AED" className="flex-shrink-0 mt-1.5" />
                        : <div className="w-[7px] flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: msg.isUnread ? "#F1F5F9" : "#94A3B8", fontWeight: msg.isUnread ? 600 : 400 }}>
                          {name}
                        </p>
                        <p className="text-[11px] text-[#94A3B8] truncate font-medium">{msg.subject}</p>
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5">{msg.snippet}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-[#475569]">
                        {formatDate(msg.date, msg.internalDate)}
                      </span>
                      {isLoading && <Loader2 size={10} className="animate-spin text-[#7C3AED]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview + Reply */}
        <div
          className="flex-1 rounded-2xl flex flex-col min-w-0 overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          {selected ? (
            <>
              {/* Email header */}
              <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-[#F1F5F9] text-base leading-snug">{selected.subject}</h2>
                    <p className="text-xs text-[#94A3B8] mt-1">{selected.from}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{formatDate(selected.date, selected.internalDate)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setShowReply(!showReply); if (!showReply) setReplyBody(""); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: "rgba(124,58,237,0.12)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.25)" }}
                    >
                      <Reply size={12} strokeWidth={2.5} />
                      Responder
                    </button>
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${selected.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl transition-all hover:opacity-70"
                      style={{ color: "#64748B" }}
                      title="Ver en Gmail"
                    >
                      <ExternalLink size={13} strokeWidth={2} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Email body */}
              <div className="flex-1 overflow-y-auto p-5">
                {selected.isHtml ? (
                  <iframe
                    srcDoc={selected.body}
                    className="w-full rounded-xl"
                    style={{ minHeight: "400px", border: "none", background: "white" }}
                    sandbox="allow-same-origin"
                    title="Email body"
                  />
                ) : (
                  <pre className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap font-sans">
                    {selected.body || selected.snippet}
                  </pre>
                )}
              </div>

              {/* Panel de respuesta */}
              {showReply && (
                <div
                  className="flex-shrink-0 border-t p-4 space-y-3"
                  style={{ borderColor: "rgba(124,58,237,0.2)", background: "#0d0d14" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Reply size={13} color="#8B5CF6" strokeWidth={2} />
                      <span className="text-xs font-semibold text-[#94A3B8]">
                        Responder a {parseFrom(selected.from).name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAISuggest}
                        disabled={aiLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: "rgba(124,58,237,0.12)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.25)" }}
                      >
                        {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} strokeWidth={2.5} />}
                        {aiLoading ? "Generando..." : "Sugerir con IA"}
                      </button>
                      <button
                        onClick={() => { setShowReply(false); setReplyBody(""); }}
                        className="p-1 rounded-lg text-[#64748B] hover:text-[#94A3B8] transition-colors"
                      >
                        <X size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Escribí tu respuesta o usá la sugerencia IA..."
                    rows={5}
                    className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none resize-none"
                    style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[#475569]">
                      {replyBody.length > 0 ? `${replyBody.length} caracteres` : ""}
                    </p>
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !replyBody.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
                    >
                      {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2.5} />}
                      {sending ? "Enviando..." : "Enviar respuesta"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
                <Mail size={20} color="#7C3AED" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#94A3B8]">Seleccioná un email</p>
                <p className="text-xs text-[#64748B] mt-1">Hacé clic en cualquier mensaje para leerlo y responderlo</p>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl mt-2"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}
              >
                <Sparkles size={12} color="#8B5CF6" strokeWidth={2} />
                <span className="text-xs text-[#8B5CF6]">IA disponible para sugerir respuestas</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
