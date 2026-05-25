"use client";

import { useState, useTransition } from "react";
import {
  Bell, Send, MessageCircle, Mail, Clock, Shield,
  CheckCircle2, AlertCircle, ExternalLink, Zap,
} from "lucide-react";
import { saveNotificationConfig, testTelegramNotification } from "@/app/app/actions";

interface NotifConfig {
  telegram_chat_id: string | null;
  telegram_enabled: boolean;
  whatsapp_phone: string | null;
  whatsapp_enabled: boolean;
  daily_summary_enabled: boolean;
  daily_summary_time: string;
  alert_vip_inactive_days: number;
  alert_big_sale_threshold: number;
}

interface Props {
  userEmail: string;
  workspaceId: string | null;
  config: NotifConfig | null;
}

export default function NotificacionesClient({ userEmail, workspaceId, config }: Props) {
  const [isPending, startTransition] = useTransition();
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const [telegramChatId, setTelegramChatId]   = useState(config?.telegram_chat_id ?? "");
  const [telegramEnabled, setTelegramEnabled] = useState(config?.telegram_enabled ?? false);
  const [dailyEnabled, setDailyEnabled]       = useState(config?.daily_summary_enabled ?? false);
  const [dailyTime, setDailyTime]             = useState(config?.daily_summary_time ?? "20:00");
  const [vipDays, setVipDays]                 = useState(config?.alert_vip_inactive_days ?? 30);
  const [bigSale, setBigSale]                 = useState(config?.alert_big_sale_threshold ?? 50000);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("telegram_chat_id",          telegramChatId);
    fd.append("telegram_enabled",          String(telegramEnabled));
    fd.append("daily_summary_enabled",     String(dailyEnabled));
    fd.append("daily_summary_time",        dailyTime);
    fd.append("alert_vip_inactive_days",   String(vipDays));
    fd.append("alert_big_sale_threshold",  String(bigSale));
    startTransition(async () => {
      try {
        await saveNotificationConfig(fd);
        setMsg("✅ Configuración guardada");
        setTimeout(() => setMsg(null), 3000);
      } catch (err: any) {
        setMsg(`❌ ${err.message}`);
      }
    });
  }

  async function handleTestTelegram() {
    if (!telegramChatId) return;
    setTestStatus("sending");
    try {
      await testTelegramNotification(telegramChatId);
      setTestStatus("ok");
      setTimeout(() => setTestStatus("idle"), 4000);
    } catch {
      setTestStatus("error");
      setTimeout(() => setTestStatus("idle"), 4000);
    }
  }

  const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
      <div className="flex items-center gap-2">
        <Icon size={15} color="#8B5CF6" strokeWidth={2} />
        <h2 className="text-sm font-bold text-[#F1F5F9]">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ enabled, onToggle, label, desc }: { enabled: boolean; onToggle: () => void; label: string; desc: string }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#F1F5F9]">{label}</p>
        <p className="text-xs text-[#64748B]">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className="relative flex-shrink-0 rounded-full transition-all duration-200"
        style={{ width: "40px", height: "22px", background: enabled ? "#7C3AED" : "rgba(100,116,139,0.3)" }}
      >
        <span className="absolute top-1 rounded-full bg-white transition-all duration-200"
          style={{ width: "14px", height: "14px", left: enabled ? "22px" : "4px" }} />
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="p-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Notificaciones
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          Configurá alertas en tiempo real para tu negocio
        </p>
      </div>

      {/* Telegram */}
      <Section title="Telegram" icon={Send}>
        <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", color: "#93C5FD" }}>
          <p className="font-semibold mb-1">¿Cómo configurarlo?</p>
          <ol className="space-y-1 list-decimal list-inside text-[#94A3B8]">
            <li>Buscá <strong className="text-[#93C5FD]">@NovaAnalyticsBot</strong> en Telegram</li>
            <li>Escribí <code className="bg-[#111118] px-1 rounded">/start</code></li>
            <li>Copiá el Chat ID que te manda el bot y pegalo abajo</li>
          </ol>
          <a href="https://t.me/NovaAnalyticsBot" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[#93C5FD] hover:text-white transition-colors">
            Abrir bot <ExternalLink size={10} />
          </a>
        </div>

        <div className="space-y-3">
          <Toggle
            enabled={telegramEnabled}
            onToggle={() => setTelegramEnabled(!telegramEnabled)}
            label="Activar notificaciones Telegram"
            desc="Recibí alertas de ventas, stock y clientes VIP"
          />
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Tu Chat ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Ej: 123456789"
                className="flex-1 rounded-xl px-3 py-2 text-sm text-[#F1F5F9] outline-none"
                style={{ background: "#0d0d14", border: "1px solid rgba(124,58,237,0.25)" }}
              />
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={!telegramChatId || testStatus === "sending"}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40"
                style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#93C5FD" }}
              >
                {testStatus === "sending" ? (
                  <span className="animate-spin">⏳</span>
                ) : testStatus === "ok" ? (
                  <CheckCircle2 size={12} color="#22c55e" />
                ) : testStatus === "error" ? (
                  <AlertCircle size={12} color="#ef4444" />
                ) : (
                  <Zap size={12} />
                )}
                {testStatus === "ok" ? "¡Enviado!" : testStatus === "error" ? "Error" : "Probar"}
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* WhatsApp */}
      <Section title="WhatsApp" icon={MessageCircle}>
        <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div className="flex items-center gap-2">
            <Clock size={12} color="#22c55e" />
            <p className="text-[#86EFAC] font-semibold">Próximamente</p>
          </div>
          <p className="text-[#64748B] mt-1">
            Integración con WhatsApp Business API en desarrollo. Activá Telegram mientras tanto para alertas instantáneas.
          </p>
        </div>
      </Section>

      {/* Resumen diario */}
      <Section title="Resumen diario por email" icon={Mail}>
        <Toggle
          enabled={dailyEnabled}
          onToggle={() => setDailyEnabled(!dailyEnabled)}
          label="Enviar resumen diario"
          desc={`Se enviará a ${userEmail} con las métricas del día`}
        />
        {dailyEnabled && (
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Hora de envío</label>
            <input
              type="time"
              value={dailyTime}
              onChange={(e) => setDailyTime(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm text-[#F1F5F9] outline-none"
              style={{ background: "#0d0d14", border: "1px solid rgba(124,58,237,0.25)" }}
            />
          </div>
        )}
      </Section>

      {/* Umbrales de alertas */}
      <Section title="Reglas de alertas automáticas" icon={Bell}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Alerta VIP inactivo — días sin comprar
            </label>
            <p className="text-xs text-[#475569] mb-2">
              Notificarte cuando un cliente VIP no compra hace más de X días
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={vipDays}
                onChange={(e) => setVipDays(Number(e.target.value))}
                min={7}
                max={365}
                className="w-20 rounded-xl px-3 py-2 text-sm text-[#F1F5F9] outline-none text-center"
                style={{ background: "#0d0d14", border: "1px solid rgba(124,58,237,0.25)" }}
              />
              <span className="text-sm text-[#64748B]">días</span>
            </div>
          </div>

          <div className="h-px" style={{ background: "rgba(124,58,237,0.1)" }} />

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Alerta venta grande — monto mínimo
            </label>
            <p className="text-xs text-[#475569] mb-2">
              Notificarte cuando una orden supere este monto (ARS)
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#64748B]">$</span>
              <input
                type="number"
                value={bigSale}
                onChange={(e) => setBigSale(Number(e.target.value))}
                min={0}
                step={1000}
                className="w-32 rounded-xl px-3 py-2 text-sm text-[#F1F5F9] outline-none"
                style={{ background: "#0d0d14", border: "1px solid rgba(124,58,237,0.25)" }}
              />
              <span className="text-sm text-[#64748B]">ARS</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Privacidad */}
      <div className="flex items-start gap-2 px-1">
        <Shield size={12} color="#475569" className="mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#475569]">
          Tus datos de contacto se usan solo para enviarte las alertas que configurás. No los compartimos con terceros.
        </p>
      </div>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-85 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
        >
          {isPending ? "Guardando..." : "Guardar configuración"}
        </button>
        {msg && <span className="text-sm text-[#94A3B8]">{msg}</span>}
      </div>
    </form>
  );
}
