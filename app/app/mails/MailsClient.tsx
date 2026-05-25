"use client";

import { useState } from "react";
import { Mail, ExternalLink, Circle, RefreshCw } from "lucide-react";

interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  isUnread: boolean;
  internalDate: string;
}

interface Props {
  isConnected: boolean;
  gmailEmail: string;
  messages: EmailMessage[];
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
    if (diff < 86400000) {
      return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

export default function MailsClient({ isConnected, gmailEmail, messages }: Props) {
  const [selected, setSelected] = useState<EmailMessage | null>(null);

  if (!isConnected) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(234,67,53,0.12)" }}
        >
          <Mail size={28} color="#EA4335" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#F1F5F9]">Gmail no conectado</h2>
          <p className="text-sm text-[#94A3B8] mt-1 max-w-xs">
            Conectá tu cuenta de Gmail para acceder a tu bandeja de entrada directamente desde Nova Analytics.
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

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>Mails</h1>
          {gmailEmail && <p className="text-sm text-[#94A3B8] mt-0.5">{gmailEmail}</p>}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: "rgba(234,67,53,0.1)",
              color: "#EA4335",
              border: "1px solid rgba(234,67,53,0.25)",
            }}
          >
            <ExternalLink size={13} strokeWidth={2.5} />
            Abrir Gmail
          </a>
          <button
            onClick={() => window.location.reload()}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#94A3B8" }}
            title="Actualizar"
          >
            <RefreshCw size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de emails */}
        <div
          className="rounded-2xl overflow-hidden lg:col-span-1"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <div
            className="px-4 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-widest"
            style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}
          >
            Bandeja de entrada · {messages.length} mensajes
          </div>
          <div className="divide-y divide-[rgba(124,58,237,0.08)] overflow-y-auto" style={{ maxHeight: "600px" }}>
            {messages.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#64748B]">
                Sin mensajes recientes
              </div>
            ) : messages.map((msg) => {
              const { name } = parseFrom(msg.from);
              const isSelected = selected?.id === msg.id;
              return (
                <button
                  key={msg.id}
                  onClick={() => setSelected(msg)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    background: isSelected ? "rgba(124,58,237,0.1)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {msg.isUnread && (
                        <Circle size={7} fill="#7C3AED" color="#7C3AED" className="flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm truncate"
                          style={{ color: msg.isUnread ? "#F1F5F9" : "#94A3B8", fontWeight: msg.isUnread ? 600 : 400 }}
                        >
                          {name}
                        </p>
                        <p className="text-xs text-[#94A3B8] truncate font-medium">{msg.subject}</p>
                        <p className="text-xs text-[#64748B] truncate mt-0.5">{msg.snippet}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#475569] flex-shrink-0 mt-0.5">
                      {formatDate(msg.date, msg.internalDate)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div
          className="rounded-2xl lg:col-span-2 flex flex-col"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)", minHeight: "400px" }}
        >
          {selected ? (
            <>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
                <h2 className="font-bold text-[#F1F5F9] text-base">{selected.subject}</h2>
                <p className="text-xs text-[#94A3B8] mt-1">{selected.from}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{formatDate(selected.date, selected.internalDate)}</p>
              </div>
              <div className="p-5 flex-1">
                <p className="text-sm text-[#94A3B8] leading-relaxed">{selected.snippet}</p>
                <a
                  href={`https://mail.google.com/mail/u/0/#inbox/${selected.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#7C3AED] hover:text-[#8B5CF6]"
                >
                  <ExternalLink size={12} strokeWidth={2.5} />
                  Ver completo en Gmail
                </a>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.1)" }}
              >
                <Mail size={20} color="#7C3AED" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-[#64748B]">Seleccioná un email para previsualizar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
