"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

type SyncResult = { workspaceId: string; synced?: number; error?: string };

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [error, setError]     = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/sync-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setResults(data.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const totalSynced = results?.reduce((a, r) => a + (r.synced ?? 0), 0) ?? 0;
  const errors      = results?.filter((r) => r.error) ?? [];

  return (
    <div
      className="anim-up metric-card rounded-2xl overflow-hidden"
      style={{ background: "#111118", border: "1px solid rgba(239,68,68,0.25)" }}
    >
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
        <div className="flex items-center gap-2">
          <RefreshCw size={15} color="#ef4444" strokeWidth={2} />
          <p className="text-sm font-semibold text-[#F1F5F9]">Sync manual TiendaNube</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
            ADMIN
          </span>
        </div>
        <button
          onClick={handleSync}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {loading ? "Sincronizando..." : "Forzar sync ahora"}
        </button>
      </div>

      <div className="px-5 py-4 text-sm text-[#64748B]">
        {!results && !error && !loading && (
          <p>Fuerza la sincronización incremental de todos los workspaces con TiendaNube conectado.</p>
        )}
        {loading && (
          <p className="text-[#94A3B8]">Sincronizando todos los workspaces...</p>
        )}
        {error && (
          <div className="flex items-center gap-2 text-[#ef4444]">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
        {results && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#22c55e] font-semibold mb-2">
              <CheckCircle size={14} />
              <span>{totalSynced} registros sincronizados en {results.length} workspace{results.length !== 1 ? "s" : ""}</span>
            </div>
            {results.map((r) => (
              <div key={r.workspaceId} className="flex items-center justify-between text-xs">
                <span className="text-[#475569] font-mono">{r.workspaceId.slice(0, 8)}…</span>
                {r.error
                  ? <span className="text-[#ef4444]">Error: {r.error.slice(0, 60)}</span>
                  : <span className="text-[#22c55e]">+{r.synced} sincronizados</span>}
              </div>
            ))}
            {errors.length > 0 && (
              <p className="text-[#f59e0b] text-xs mt-2">⚠ {errors.length} workspace(s) con error. Revisá la consola de Vercel.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
