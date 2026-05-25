export default function MetaAdsLoading() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-48 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="h-9 w-36 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-7 w-20 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-2.5 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        ))}
      </div>

      {/* Campaigns table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="h-4 w-24 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5"
            style={{ borderBottom: i < 5 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 rounded" style={{ width: `${50 + (i % 3) * 15}%`, background: "rgba(255,255,255,0.06)" }} />
              <div className="h-2.5 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-3 w-16 rounded flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
