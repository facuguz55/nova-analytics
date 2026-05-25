export default function AlertasLoading() {
  return (
    <div className="p-6 space-y-5 max-w-3xl animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-52 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="h-9 w-36 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Alert cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 rounded" style={{ width: `${50 + (i % 3) * 15}%`, background: "rgba(255,255,255,0.06)" }} />
              <div className="h-3 w-32 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="h-6 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
          <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-3 rounded" style={{ width: "70%", background: "rgba(255,255,255,0.03)" }} />
        </div>
      ))}
    </div>
  );
}
