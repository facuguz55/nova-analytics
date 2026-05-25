export default function AnalisisLoading() {
  return (
    <div className="p-6 space-y-6 max-w-screen-xl animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-52 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="h-9 w-48 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-7 w-20 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>
        ))}
      </div>

      {/* Chart ventas mensuales */}
      <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="h-4 w-40 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-52 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }} />
      </div>

      {/* 2 charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="h-4 w-36 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-44 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
