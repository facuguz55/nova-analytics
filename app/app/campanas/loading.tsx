export default function CampanasLoading() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-52 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="h-9 w-40 rounded-xl" style={{ background: "rgba(124,58,237,0.2)" }} />
      </div>

      {/* Campaigns list */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <div className="h-4 rounded" style={{ width: `${45 + (i % 3) * 15}%`, background: "rgba(255,255,255,0.06)" }} />
              <div className="h-3 w-40 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="h-6 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="h-2.5 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
                <div className="h-5 w-14 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
