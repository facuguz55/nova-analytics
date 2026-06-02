"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function CancelSubscriptionSection({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen]           = useState(false);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);

  async function handleCancel() {
    if (input !== "CANCELAR") {
      toast.error("Escribí exactamente CANCELAR para confirmar.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error");
      toast.success("Suscripción cancelada.");
      setTimeout(() => window.location.href = "/billing", 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cancelar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen(!open)}
        className="text-[11px] text-[#2d3748] hover:text-[#475569] transition-colors"
      >
        Opciones avanzadas de cuenta
      </button>

      {open && (
        <div className="mt-3 rounded-xl p-4 space-y-3"
          style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-xs text-[#475569] font-medium">Cancelar suscripción</p>
          <p className="text-xs text-[#334155]">
            Para cancelar, escribí <span className="font-mono font-bold text-[#475569]">CANCELAR</span> en el campo de abajo y confirmá.
          </p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí CANCELAR"
            className="w-full rounded-lg px-3 py-2 text-xs font-mono outline-none"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#94A3B8",
            }}
          />
          <button
            onClick={handleCancel}
            disabled={loading || input !== "CANCELAR"}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{
              background: "rgba(239,68,68,0.08)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            {loading ? "Cancelando..." : "Confirmar cancelación"}
          </button>
        </div>
      )}
    </div>
  );
}
