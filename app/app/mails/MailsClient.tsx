"use client";

import { useState, useCallback, useRef } from "react";
import {
  Mail, Send, Sparkles, AlertCircle, CheckCircle2, Inbox,
  Copy, X, Search, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────────

type Categoria = "urgente" | "reclamo" | "consulta" | "positivo" | "info" | "spam";
type Filtro = "todos" | Categoria;

interface MailItem {
  id: string;
  threadId: string;
  de: string;
  nombre: string;
  asunto: string;
  cuerpo: string;
  fecha: string;
  leido: boolean;
  categoria: string;
  resumen: string;
  respuestaSugerida: string;
  respondido: boolean;
}

// ── Config ─────────────────────────────────────────────────────────────────

const CAT: Record<Categoria, { label: string; color: string; bg: string }> = {
  urgente:  { label: "Urgente",  color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  reclamo:  { label: "Reclamo",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  consulta: { label: "Consulta", color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  positivo: { label: "Positivo", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  info:     { label: "Info",     color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  spam:     { label: "Spam",     color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "todos",    label: "Todos" },
  { key: "urgente",  label: "Urgente" },
  { key: "reclamo",  label: "Reclamo" },
  { key: "consulta", label: "Consulta" },
  { key: "positivo", label: "Positivo" },
  { key: "info",     label: "Info" },
  { key: "spam",     label: "Spam" },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d}d`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
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

function MailBody({ cuerpo }: { cuerpo: string }) {
  const segments = parseMailBody(cuerpo);
  return (
    <div className="space-y-4">
      {segments.map((seg, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{
            background: seg.type === "main" ? "rgba(124,58,237,0.05)" : "rgba(255,255,255,0.02)",
            border: seg.type === "main" ? "1px solid rgba(124,58,237,0.15)" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {seg.header && (
            <p className="text-[10px] text-[#64748B] mb-2 italic">{seg.header}</p>
          )}
          <pre className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap font-sans">
            {seg.text}
          </pre>
        </div>
      ))}
    </div>
  );
}

function CatBadge({ cat }: { cat: string }) {
  const c = CAT[cat as Categoria] ?? CAT.info;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}33` }}
    >
      {c.label}
    </span>
  );
}

function MailSkeleton() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-[rgba(124,58,237,0.07)]">
          <div className="flex justify-between mb-2">
            <div className="h-3 rounded bg-[rgba(255,255,255,0.06)] w-2/5 animate-pulse" />
            <div className="h-2.5 rounded bg-[rgba(255,255,255,0.04)] w-1/5 animate-pulse" />
          </div>
          <div className="h-2.5 rounded bg-[rgba(255,255,255,0.04)] w-1/4 mb-2 animate-pulse" />
          <div className="h-2.5 rounded bg-[rgba(255,255,255,0.03)] w-4/5 animate-pulse" />
        </div>
      ))}
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function MailsClient({
  isConnected,
  gmailEmail,
  mails: initialMails,
}: {
  isConnected: boolean;
  gmailEmail: string;
  mails: MailItem[];
}) {
  const [mails, setMails] = useState<MailItem[]>(initialMails);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MailItem | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [atendidos, setAtendidos] = useState<Set<string>>(
    new Set(initialMails.filter(m => m.respondido).map(m => m.id)),
  );
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncMails = useCallback(async () => {
    setSyncing(true);
    setSyncError(false);
    try {
      const res = await fetch("/api/mails/sync", { method: "POST" });
      if (!res.ok) throw new Error();
      // Recargar la página para mostrar los nuevos mails de la DB
      window.location.reload();
    } catch {
      setSyncError(true);
      toast.error("Error al sincronizar. Intentá de nuevo.");
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleSelect = (mail: MailItem) => {
    setRespuesta("");
    setLocalRead(prev => new Set([...prev, mail.id]));
    setSelected(mail);
  };

  const sendReply = async () => {
    if (!selected || !respuesta.trim()) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/mails/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selected.de,
          subject: selected.asunto,
          body: respuesta,
          threadId: selected.threadId,
          mailId: selected.id,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("¡Respuesta enviada correctamente!");
      setRespuesta("");
      setAtendidos(prev => new Set([...prev, selected.id]));
      setMails(prev =>
        prev.map(m => m.id === selected.id ? { ...m, respondido: true } : m),
      );
    } catch {
      toast.error("No se pudo enviar. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

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

  const counts = mails.reduce((acc, m) => {
    acc[m.categoria] = (acc[m.categoria] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const baseFiltered = filtro === "todos"
    ? mails.filter(m => m.categoria !== "spam")
    : mails.filter(m => m.categoria === filtro);

  const filtered = search.trim()
    ? baseFiltered.filter(m => {
        const q = search.toLowerCase();
        return (
          (m.nombre || m.de).toLowerCase().includes(q) ||
          m.asunto.toLowerCase().includes(q) ||
          m.resumen.toLowerCase().includes(q)
        );
      })
    : baseFiltered;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── PANEL IZQUIERDO ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        <div
          className="flex flex-col flex-shrink-0"
          style={{ width: "300px", borderRight: "1px solid rgba(124,58,237,0.12)" }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-sm font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.01em" }}>
                  Bandeja de entrada
                </h1>
                {gmailEmail && <p className="text-[10px] text-[#64748B] mt-0.5">{gmailEmail}</p>}
              </div>
              <button
                onClick={syncMails}
                disabled={syncing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(124,58,237,0.1)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <RefreshCw size={11} strokeWidth={2.5} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Sync..." : "Actualizar"}
              </button>
            </div>
            {syncError && (
              <p className="text-[10px] text-[#ef4444] mt-1 flex items-center gap-1">
                <AlertCircle size={9} /> Error al sincronizar
              </p>
            )}
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
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.15)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 text-[#64748B] hover:text-[#94A3B8]">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {FILTROS.map(f => {
              const isActive = filtro === f.key;
              const c = CAT[f.key as Categoria] ?? { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" };
              return (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all"
                  style={{
                    color: f.key === "todos" ? "#06b6d4" : c.color,
                    background: isActive ? (f.key === "todos" ? "rgba(6,182,212,0.14)" : c.bg) : "transparent",
                    border: `1px solid ${f.key === "todos" ? "#06b6d4" : c.color}${isActive ? "80" : "40"}`,
                  }}
                >
                  {f.label}
                  {f.key !== "todos" && counts[f.key]
                    ? <span className="ml-1 opacity-70">{counts[f.key]}</span>
                    : f.key === "todos"
                    ? <span className="ml-1 opacity-70">{mails.filter(m => m.categoria !== "spam").length}</span>
                    : null}
                </button>
              );
            })}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(124,58,237,0.07)]">
            {mails.length === 0 && !syncing && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-[#64748B]">Sin mails</p>
                <button
                  onClick={syncMails}
                  className="mt-3 text-xs text-[#8B5CF6] hover:underline"
                >
                  Sincronizar ahora
                </button>
              </div>
            )}
            {mails.length === 0 && syncing && <MailSkeleton />}
            {filtered.length === 0 && mails.length > 0 && (
              <div className="px-4 py-8 text-center text-xs text-[#64748B]">
                Sin resultados
              </div>
            )}

            {filtered.map(mail => {
              const isUnread = !mail.leido && !localRead.has(mail.id);
              const isActive = selected?.id === mail.id;
              return (
                <button
                  key={mail.id}
                  onClick={() => handleSelect(mail)}
                  className="w-full text-left px-4 py-3 transition-colors hover:bg-[rgba(124,58,237,0.06)]"
                  style={{
                    background: isActive ? "rgba(124,58,237,0.1)" : "transparent",
                    borderLeft: isActive ? "2px solid #7C3AED" : "2px solid transparent",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span
                      className="text-xs truncate"
                      style={{ color: isUnread ? "#F1F5F9" : "#94A3B8", fontWeight: isUnread ? 600 : 400 }}
                    >
                      {mail.nombre || mail.de}
                    </span>
                    <span className="text-[10px] text-[#475569] flex-shrink-0">{timeAgo(mail.fecha)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    {isUnread && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: CAT[mail.categoria as Categoria]?.color ?? "#06b6d4" }}
                      />
                    )}
                    <CatBadge cat={mail.categoria} />
                    {(atendidos.has(mail.id) || mail.respondido) && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                      >
                        <CheckCircle2 size={9} strokeWidth={2.5} /> Atendido
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-[#64748B] truncate">
                    {mail.resumen || mail.asunto}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── PANEL DERECHO ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
                <Inbox size={20} color="#7C3AED" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#94A3B8]">Seleccioná un mail</p>
                <p className="text-xs text-[#64748B] mt-1">
                  {mails.length > 0 ? `${mails.length} mails cargados` : "Hacé click en Actualizar para sincronizar"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">

              {/* Header del mail */}
              <div className="flex-shrink-0 px-6 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-bold text-[#F1F5F9] text-base truncate">{selected.asunto}</h2>
                      <CatBadge cat={selected.categoria} />
                    </div>
                    <p className="text-xs font-semibold text-[#8B5CF6]">{selected.nombre || selected.de}</p>
                    <p className="text-[11px] text-[#64748B]">{selected.de}</p>
                    <p className="text-[11px] text-[#475569] mt-0.5">
                      {formatFecha(selected.fecha)} · {formatHora(selected.fecha)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-[#64748B] hover:text-[#94A3B8] transition-colors p-1 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Cuerpo scrolleable */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">

                {/* Cuerpo del email */}
                <MailBody cuerpo={selected.cuerpo} />

                {/* Separador */}
                <div style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }} />

                {/* Respuesta sugerida por IA */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={13} color="#8B5CF6" strokeWidth={2.5} />
                    <span className="text-[10px] font-semibold tracking-widest text-[#8B5CF6] uppercase">
                      Respuesta sugerida por IA
                    </span>
                  </div>

                  {selected.respuestaSugerida ? (
                    <>
                      <div
                        className="rounded-xl px-4 py-3 text-sm text-[#94A3B8] leading-relaxed"
                        style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}
                      >
                        {selected.respuestaSugerida}
                      </div>
                      <button
                        onClick={() => {
                          setRespuesta(selected.respuestaSugerida);
                          toast.success("Sugerencia copiada al editor");
                        }}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(124,58,237,0.08)", color: "#8B5CF6", border: "1px solid rgba(124,58,237,0.2)" }}
                      >
                        <Copy size={11} strokeWidth={2.5} /> Usar sugerencia
                      </button>
                    </>
                  ) : (
                    <div
                      className="rounded-xl px-4 py-3 text-xs text-[#475569] italic"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.1)" }}
                    >
                      No hay sugerencia disponible. Sincronizá para generarla.
                    </div>
                  )}
                </div>

                {/* Separador */}
                <div style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }} />

                {/* Editor de respuesta */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Send size={12} color="#94A3B8" strokeWidth={2} />
                    <span className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase">Tu respuesta</span>
                  </div>
                  <p className="text-[11px] text-[#475569] mb-2">Re: {selected.asunto}</p>
                  <textarea
                    value={respuesta}
                    onChange={e => setRespuesta(e.target.value)}
                    placeholder="Escribí tu respuesta acá..."
                    rows={5}
                    className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none resize-none"
                    style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
                  />
                  <button
                    onClick={sendReply}
                    disabled={enviando || !respuesta.trim()}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
                  >
                    {enviando
                      ? <><RefreshCw size={14} className="animate-spin" /> Enviando...</>
                      : <><Send size={14} strokeWidth={2.5} /> Enviar respuesta</>}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
