export default function IntegracionesLoading() {
  return (
    <div className="p-6 space-y-5 max-w-2xl animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-36 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-4 w-52 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Integration cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-3 w-48 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="h-6 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
          <div className="h-px w-full mb-4" style={{ background: "rgba(124,58,237,0.1)" }} />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="h-9 w-full rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.1)" }} />
            </div>
            <div className="h-9 w-32 rounded-xl" style={{ background: "rgba(124,58,237,0.12)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
