export default function ProductosLoading() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-44 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-7 w-16 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>
        ))}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.12)" }}>
            <div className="h-36 w-full" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="p-4 space-y-2">
              <div className="h-4 rounded" style={{ width: `${60 + (i % 3) * 12}%`, background: "rgba(255,255,255,0.06)" }} />
              <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="flex items-center justify-between pt-1">
                <div className="h-5 w-16 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="h-4 w-12 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
