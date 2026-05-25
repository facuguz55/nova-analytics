export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-36 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="h-8 w-48 rounded-xl hidden md:block" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="w-8 h-8 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div className="h-8 w-32 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-3 w-40 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        ))}
      </div>

      {/* Activity row */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="h-3 w-32 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 space-y-3"
              style={{ borderRight: i < 2 ? "1px solid rgba(124,58,237,0.1)" : "none" }}>
              <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-8 w-20 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-3 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="h-4 w-40 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-52 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }} />
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.1)" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="h-4 w-32 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-3 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3"
            style={{ borderBottom: i < 4 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-36 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-2.5 w-24 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="text-right space-y-1.5">
              <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-2.5 w-14 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
