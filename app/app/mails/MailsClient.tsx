"use client";

import { useState, useCallback } from "react";
import { Mail, ExternalLink, Circle, RefreshCw, Send, Sparkles, Loader2, Copy } from "lucide-react";
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
  const [replyBody, setReplyBody] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const selectMessage = useCallback(async (msg: EmailMessage) => {
    if (loadingId) return;
    setLoadingId(msg.id);
    setReplyBody("");
    setAiSuggestion("");
    try {
      const res = await fetch(`/api/mails/message?id=${msg.id}`);
      if (!res.ok) throw new Error();
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
    setAiSuggestion("");
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
      const data = await res.json() as { suggestion?: string };
      if (data.suggestion) setAiSuggestion(data.suggestion);
      else toast.error("No se pudo generar sugerencia");
    } catch {
      toast.error("Error al generar sugerencia");
    } finally {
      setAiLoading(false);
    }
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
          inReplyTo: selected.messageId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Respuesta enviada");
      setReplyBody("");
      setAiSuggestion("");
    } catch {
      toast.error("No se pudo enviar");
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

  const unreadCount = messages.filter((m) => m.isUnread).length;
  const filtered = filter === "unread" ? messages.filter((m) => m.isUnread) : messages;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
        <div>
          <h1 className="text-lg font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Mails</h1>
          {gmailEmail && <p className="text-xs text-[#94A3B8]">{gmailEmail}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl p-1 gap-1" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: filter === f ? "#7C3AED" : "transparent", color: filter === f ? "white" : "#94A3B8" }}
              >
                {f === "all" ? `Todos (${messages.length})` : `No leídos (${unreadCount})`}
              </button>
            ))}
          </div>
          <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(234,67,53,0.1)", color: "#EA4335", border: "1px solid rgba(234,67,53,0.2)" }}>
            <ExternalLink size={12} strokeWidth={2.5} /> Gmail
          </a>
          <button onClick={() => window.location.reload()}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#94A3B8" }}>
            <RefreshCw size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Lista de emails */}
        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: "280px", borderRight: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(124,58,237,0.07)]">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#64748B]">Sin mensajes</div>
            ) : filtered.map((msg) => {
              const { name } = parseFrom(msg.from);
              const isSelected = selected?.id === msg.id;
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
                        ? <Circle size={6} fill="#7C3AED" color="#7C3AED" className="flex-shrink-0 mt-1.5" />
                        : <div className="w-[6px] flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: msg.isUnread ? "#F1F5F9" : "#94A3B8", fontWeight: msg.isUnread ? 600 : 400 }}>
                          {name}
                        </p>
                        <p className="text-[11px] text-[#94A3B8] truncate">{msg.subject}</p>
                        <p className="text-[10px] text-[#64748B] truncate mt-0.5">{msg.snippet}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#475569] flex-shrink-0">{formatDate(msg.date, msg.internalDate)}</span>
                  </div>
                  {loadingId === msg.id && (
                    <div className="mt-1 flex justify-end">
                      <Loader2 size={10} className="animate-spin text-[#7C3AED]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel derecho */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0 min-h-0">

            {/* Email header */}
            <div className="flex-shrink-0 px-6 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-[#F1F5F9] text-base">{selected.subject}</h2>
                  <p className="text-xs text-[#7C3AED] mt-0.5">{parseFrom(selected.from).email}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {formatDate(selected.date, selected.internalDate)}
                  </p>
                </div>
                <a href={`https://mail.google.com/mail/u/0/#inbox/${selected.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[#64748B] hover:text-[#94A3B8] transition-colors p-1"
                  title="Ver en Gmail">
                  <ExternalLink size={14} strokeWidth={2} />
                </a>
              </div>
            </div>

            {/* Email body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {selected.isHtml ? (
                <iframe
                  srcDoc={selected.body}
                  className="w-full rounded-xl"
                  style={{ minHeight: "300px", border: "none", background: "white" }}
                  sandbox="allow-same-origin"
                  title="Email"
                />
              ) : (
                <pre className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap font-sans">
                  {selected.body || selected.snippet}
                </pre>
              )}
            </div>

            {/* Zona de respuesta — siempre visible */}
            <div className="flex-shrink-0" style={{ borderTop: "1px solid rgba(124,58,237,0.15)", background: "#0d0d14" }}>

              {/* Sugerencia IA */}
              <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} color="#8B5CF6" strokeWidth={2.5} />
                    <span className="text-[10px] font-semibold tracking-widest text-[#8B5CF6] uppercase">Respuesta sugerida por IA</span>
                  </div>
                  <button
                    onClick={handleAISuggest}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "rgba(124,58,237,0.12)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.25)" }}
                  >
                    {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} strokeWidth={2.5} />}
                    {aiLoading ? "Generando..." : "Generar sugerencia"}
                  </button>
                </div>

                <div
                  className="w-full rounded-xl px-4 py-3 text-sm min-h-[48px]"
                  style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)", color: aiSuggestion ? "#94A3B8" : "#475569" }}
                >
                  {aiLoading
                    ? <span className="text-[#64748B] italic text-xs">Generando sugerencia...</span>
                    : aiSuggestion || <span className="italic text-xs">La sugerencia aparecerá acá...</span>
                  }
                </div>

                {aiSuggestion && (
                  <button
                    onClick={() => { setReplyBody(aiSuggestion); toast.success("Sugerencia copiada"); }}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(124,58,237,0.08)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    <Copy size={11} strokeWidth={2.5} /> Usar sugerencia
                  </button>
                )}
              </div>

              {/* Tu respuesta */}
              <div className="px-5 pt-3 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Send size={11} color="#94A3B8" strokeWidth={2} />
                  <span className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Tu respuesta</span>
                </div>
                <p className="text-[11px] text-[#475569] mb-2">
                  Re: {selected.subject}
                </p>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Escribí tu respuesta acá..."
                  rows={4}
                  className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none resize-none"
                  style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !replyBody.trim()}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2.5} />}
                  {sending ? "Enviando..." : "Enviar respuesta"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
              <Mail size={20} color="#7C3AED" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#94A3B8]">Seleccioná un email</p>
              <p className="text-xs text-[#64748B] mt-1">Leé, respondé y usá IA para redactar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
