"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Cuáles son mis mejores días de ventas?",
  "¿Cómo puedo mejorar mi tasa de conversión?",
  "Estrategias para aumentar el ticket promedio",
  "¿Qué productos debería reponer primero?",
];

export default function IAClient({ businessContext }: { businessContext: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu asistente IA de Nova Analytics. Analicé los datos de tu negocio y estoy listo para ayudarte con estrategias, insights y recomendaciones. ¿En qué te puedo ayudar hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        body: JSON.stringify({
          messages: [...messages, userMsg],
          // systemContext eliminado — se genera server-side en /api/ia/chat
        }),
      });

      if (!res.ok) throw new Error("Error en la respuesta");

      const data = await res.json() as { message: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu consulta. Verificá que la API key de Anthropic esté configurada correctamente.",
      }]);
    } finally {
      setLoading(false);
    }
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
              {msg.content.split("\n").map((line, li) => (
                <span key={li}>
                  {line}
                  {li < msg.content.split("\n").length - 1 && <br />}
                </span>
              ))}
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
            placeholder="Preguntá sobre tus ventas, estrategias, productos..."
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
