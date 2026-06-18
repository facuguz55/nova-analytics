"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Cómo vengo este mes vs lo normal?",
  "¿Qué productos me dan más ganancia?",
  "¿Qué stock tengo que reponer ya?",
  "Dame 3 ideas para subir el ticket promedio",
  "¿Quiénes son mis mejores clientes?",
  "¿Mi margen está bien o tengo que ajustar precios?",
];

// Render liviano de markdown: **negrita**, *itálica*, viñetas y saltos.
function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const bullet = /^\s*[-*]\s+/.test(line);
    const clean = line.replace(/^\s*[-*]\s+/, "");
    const parts = clean.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((p, j) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={j} className="text-[#F1F5F9] font-bold">{p.slice(2, -2)}</strong>;
      if (p.startsWith("*") && p.endsWith("*")) return <em key={j} className="text-[#c4b5fd]">{p.slice(1, -1)}</em>;
      return <span key={j}>{p}</span>;
    });
    return (
      <div key={i} className={bullet ? "flex gap-2" : ""}>
        {bullet && <span className="text-[#a78bfa] flex-shrink-0">•</span>}
        <span>{parts}</span>
      </div>
    );
  });
}

type PendingAction = { tool: string; params: Record<string, unknown>; preview: string };

export default function IAClient({ connected, storeName }: { connected: boolean; storeName: string | null }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: connected
        ? `¡Hola! Soy tu asistente de Nova Analytics. Ya tengo cargados los datos reales de ${storeName ?? "tu tienda"} — ventas, productos, clientes y rentabilidad de los últimos 90 días. Preguntame lo que quieras sobre tu negocio. 📊`
        : "¡Hola! Soy tu asistente de Nova Analytics. Todavía no veo tu TiendaNube conectada, así que no puedo analizar tus ventas reales. Conectala en Configuración → Integraciones y vuelvo a tener todo tu negocio a mano. Igual puedo ayudarte con estrategias de e-commerce mientras tanto.",
    },
  ]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!res.ok) throw new Error("Error en la respuesta");

      const data = await res.json() as { message: string; pendingAction?: PendingAction };
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.pendingAction) {
        setPendingAction(data.pendingAction);
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu consulta. Verificá que la API key de Anthropic esté configurada correctamente.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          executeAction: { tool: action.tool, params: action.params },
        }),
      });
      const data = await res.json() as { message: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error al ejecutar la acción." }]);
    } finally {
      setLoading(false);
    }
  }

  function cancelAction() {
    setPendingAction(null);
    setMessages((prev) => [...prev, { role: "assistant", content: "Acción cancelada. ¿Necesitás algo más?" }]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-64px)]">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.15)" }}
        >
          <Bot size={18} color="#a78bfa" strokeWidth={2} />
        </div>
        <div>
          <p className="font-bold text-[#F1F5F9] text-sm">IA Assistant</p>
          <p className="text-xs text-[#94A3B8]">Claude · Datos del negocio cargados</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-green-400">Activo</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #8b5cf6, #c026d3)"
                  : "rgba(139,92,246,0.15)",
              }}
            >
              {msg.role === "user" ? (
                <User size={14} color="white" strokeWidth={2} />
              ) : (
                <Bot size={14} color="#a78bfa" strokeWidth={2} />
              )}
            </div>
            <div
              className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={{
                background: msg.role === "user"
                  ? "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(37,99,235,0.15))"
                  : "#111118",
                border: msg.role === "user"
                  ? "1px solid rgba(139,92,246,0.3)"
                  : "1px solid rgba(139,92,246,0.2)",
                color: "#F1F5F9",
              }}
            >
              <div className="space-y-1">{renderContent(msg.content)}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.15)" }}
            >
              <Bot size={14} color="#a78bfa" strokeWidth={2} />
            </div>
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (solo si está en el inicio) */}
      {messages.length <= 1 && (
        <div className="px-4 sm:px-6 pb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
              style={{
                background: "rgba(139,92,246,0.08)",
                color: "#a78bfa",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <Sparkles size={10} strokeWidth={2} />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Confirmación de acción */}
      {pendingAction && (
        <div
          className="mx-4 sm:mx-6 mb-3 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ background: "rgba(225,105,30,0.1)", border: "1px solid rgba(225,105,30,0.3)" }}
        >
          <p className="text-xs font-semibold text-[#e1691e] mb-1 uppercase tracking-wide">
            Confirmar acción
          </p>
          <p className="text-sm text-[#F1F5F9] mb-3">{pendingAction.preview}</p>
          <div className="flex gap-2">
            <button
              onClick={confirmAction}
              className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "#e1691e" }}
            >
              Confirmar
            </button>
            <button
              onClick={cancelAction}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "#94A3B8" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className="px-4 sm:px-6 pb-5 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(139,92,246,0.15)", paddingTop: "16px" }}
      >
        <div
          className="flex items-end gap-3 rounded-2xl px-4 py-3"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Preguntá sobre tus ventas, o decí 'vendí un iPhone a $500K en efectivo'…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none resize-none placeholder:text-[#475569]"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80 disabled:opacity-30"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #c026d3)" }}
          >
            <Send size={14} color="white" strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-[10px] text-[#475569] mt-1.5 text-center">
          Powered by Claude · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
