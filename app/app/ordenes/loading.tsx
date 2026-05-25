export default function OrdenesLoading() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-44 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="h-9 w-36 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 rounded-lg" style={{ width: `${56 + i * 8}px`, background: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>

      {/* Orders table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          {["Orden", "Cliente", "Total", "Estado", "Fecha"].map((h) => (
            <div key={h} className="h-3 w-16 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 items-center px-5 py-3.5"
            style={{ borderBottom: i < 9 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="h-3 w-14 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="space-y-1">
              <div className="h-3 rounded" style={{ width: `${60 + (i % 3) * 15}%`, background: "rgba(255,255,255,0.06)" }} />
              <div className="h-2.5 w-24 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="h-3 w-16 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-5 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
