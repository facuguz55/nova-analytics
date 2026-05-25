export default function RentabilidadLoading() {
  return (
    <div className="p-6 space-y-5 max-w-3xl animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-56 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-9 w-24 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="w-8 h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-6 w-24 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        ))}
      </div>

      {/* Comparacion mensual */}
      <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="h-4 w-40 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="h-8 w-28 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Waterfall table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="h-4 w-44 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: i < 4 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="h-3 w-36 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
