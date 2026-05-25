export default function ClientesLoading() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-48 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-7 w-16 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>
        ))}
      </div>

      {/* Client list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="h-4 w-24 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5"
            style={{ borderBottom: i < 9 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 rounded" style={{ width: `${40 + (i % 4) * 10}%`, background: "rgba(255,255,255,0.06)" }} />
              <div className="h-2.5 w-32 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="text-right space-y-1.5">
              <div className="h-3.5 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-2.5 w-14 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
