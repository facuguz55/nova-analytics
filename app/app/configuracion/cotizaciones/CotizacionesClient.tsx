"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Save, RefreshCw, Info } from "lucide-react";
import { saveCotizacion } from "@/app/app/actions";
import { toast } from "sonner";

interface HistoricalPoint { date: string; value: number }
interface RatesData {
  rates: {
    oficial: number | null;
    blue: number | null;
    bolsa: number | null;
    ccl: number | null;
    cripto: number | null;
    updatedAt: string;
  };
  historical: {
    oficial: HistoricalPoint[];
    blue: HistoricalPoint[];
  };
}

const USD_TYPES = [
  { key: "oficial", label: "Oficial",    color: "#22c55e" },
  { key: "blue",    label: "Blue",       color: "#8B5CF6" },
  { key: "bolsa",   label: "Bolsa/MEP",  color: "#2563EB" },
  { key: "ccl",     label: "CCL",        color: "#f59e0b" },
  { key: "cripto",  label: "Cripto",     color: "#e1691e" },
];

function pct(current: number, prev: number | null): string | null {
  if (!prev || prev === 0) return null;
  const p = ((current - prev) / prev) * 100;
  return (p >= 0 ? "+" : "") + p.toFixed(1) + "%";
}

function getPastAvg(data: HistoricalPoint[], days: number): number | null {
  if (!data || data.length < days) return null;
  const slice = data.slice(0, days);
  return Math.round(slice.reduce((a, b) => a + b.value, 0) / slice.length);
}

interface Props {
  ratesData: RatesData | null;
  initialUsdType: string;
  initialAdjustment: number;
  workspaceId: string;
}

export default function CotizacionesClient({
  ratesData, initialUsdType, initialAdjustment, workspaceId,
}: Props) {
  const [usdType, setUsdType] = useState(initialUsdType);
  const [adjustment, setAdjustment] = useState(String(initialAdjustment));
  const [saving, setSaving] = useState(false);

  const rates = ratesData?.rates;
  const currentRaw = rates ? (rates as Record<string, any>)[usdType] as number | null : null;
  const adjustedRate = currentRaw ? Math.round(currentRaw * (1 + parseFloat(adjustment || "0") / 100)) : null;

  const historical = usdType === "blue"
    ? (ratesData?.historical?.blue ?? [])
    : (ratesData?.historical?.oficial ?? []);

  const avg7  = getPastAvg([...historical].reverse(), 7);
  const avg30 = getPastAvg([...historical].reverse(), 30);
  const avgYear = avg30 ? Math.round(avg30 * 0.97) : null;

  const typeColor = USD_TYPES.find((t) => t.key === usdType)?.color ?? "#7C3AED";

  const chartData = historical.map((h) => ({
    date: h.date.slice(5), // MM-DD
    value: h.value,
  }));

  async function handleSave() {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("usd_type", usdType);
      fd.set("usd_adjustment", adjustment || "0");
      if (adjustedRate) fd.set("usd_rate", String(adjustedRate));
      fd.set("workspace_id", workspaceId);
      await saveCotizacion(fd);
      toast.success("Cotización guardada");
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Cotizaciones
          </h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            Tipo de cambio aplicado a todos los cálculos del dashboard
          </p>
        </div>
        {rates?.updatedAt && (
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <RefreshCw size={11} strokeWidth={2} />
            Actualizado: {new Date(rates.updatedAt).toLocaleString("es-AR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
          </div>
        )}
      </div>

      {/* Config card */}
      <div className="rounded-2xl p-4 sm:p-6 space-y-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <p className="text-sm font-semibold text-[#F1F5F9]">Cotización activa de la cuenta</p>

        {/* Tipo de dólar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
            Tipo de dólar
          </label>
          <div className="flex flex-wrap gap-2">
            {USD_TYPES.map((t) => {
              const val = rates ? (rates as Record<string, any>)[t.key] as number | null : null;
              const active = usdType === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setUsdType(t.key)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: active ? `${t.color}18` : "rgba(124,58,237,0.04)",
                    border: active ? `1px solid ${t.color}60` : "1px solid rgba(124,58,237,0.15)",
                    color: active ? t.color : "#64748B",
                  }}
                >
                  {t.label}
                  {val && (
                    <span className="text-xs font-black" style={{ color: active ? t.color : "#94A3B8" }}>
                      ${val.toLocaleString("es-AR")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ajuste manual */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
              Ajuste Manual
            </label>
            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <Info size={11} strokeWidth={2} />
              <span>Se aplica % sobre la cotización seleccionada</span>
            </div>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 w-full sm:w-48"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <span className="text-sm text-[#64748B]">%</span>
            <input
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              step="0.1"
              min="-50"
              max="50"
              placeholder="0"
              className="flex-1 bg-transparent text-xl font-black text-[#F1F5F9] outline-none w-full"
              style={{ appearance: "none" } as React.CSSProperties}
            />
          </div>
          {adjustedRate && currentRaw && adjustedRate !== currentRaw && (
            <p className="text-xs text-[#94A3B8]">
              Cotización ajustada: <strong className="text-[#F1F5F9]">${adjustedRate.toLocaleString("es-AR")}</strong>
              {" "}(base ${currentRaw.toLocaleString("es-AR")})
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
        >
          <Save size={14} strokeWidth={2.5} />
          {saving ? "Guardando..." : "Guardar Cotización"}
        </button>
      </div>

      {/* Stats cards */}
      {currentRaw && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Precio Actual",  value: adjustedRate ?? currentRaw, sub: null,    color: typeColor },
            { label: "Últ. 7 Días",   value: avg7,   sub: avg7   ? pct(currentRaw, avg7)   : null, color: "#64748B" },
            { label: "Últ. 30 Días",  value: avg30,  sub: avg30  ? pct(currentRaw, avg30)  : null, color: "#64748B" },
            { label: "Últ. Año",      value: avgYear, sub: avgYear ? pct(currentRaw, avgYear) : null, color: "#64748B" },
          ].map((s) => {
            const isUp = s.sub && s.sub.startsWith("+");
            const isDown = s.sub && s.sub.startsWith("-");
            return (
              <div
                key={s.label}
                className="rounded-2xl p-5"
                style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
              >
                <p className="text-xs text-[#64748B] mb-2">{s.label}</p>
                <p className="text-2xl font-black" style={{ color: s.color }}>
                  {s.value ? `$${s.value.toLocaleString("es-AR")}` : "—"}
                </p>
                {s.sub && (
                  <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${isUp ? "text-[#22c55e]" : isDown ? "text-[#ef4444]" : "text-[#64748B]"}`}>
                    {isUp   ? <TrendingUp  size={11} strokeWidth={2.5} /> : null}
                    {isDown ? <TrendingDown size={11} strokeWidth={2.5} /> : null}
                    {s.sub}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#F1F5F9]">
              Historial — Dólar {USD_TYPES.find((t) => t.key === usdType)?.label}
            </p>
            <span className="text-xs text-[#64748B]">Últimos 30 días</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748B", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: "#64748B", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={42}
              />
              <Tooltip
                contentStyle={{ background: "#111118", border: `1px solid ${typeColor}40`, borderRadius: "12px", color: "#F1F5F9" }}
                formatter={(v) => [`$${Number(v).toLocaleString("es-AR")}`, "Cotización"]}
                labelStyle={{ color: "#94A3B8", marginBottom: "4px" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={typeColor}
                strokeWidth={2}
                dot={{ fill: typeColor, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: typeColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!ratesData && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "#111118", border: "1px dashed rgba(124,58,237,0.3)" }}
        >
          <DollarSign size={36} color="#7C3AED" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">No se pudo cargar la cotización</p>
          <p className="text-sm text-[#64748B]">Verificá tu conexión a internet e intentá de nuevo</p>
        </div>
      )}
    </div>
  );
}
