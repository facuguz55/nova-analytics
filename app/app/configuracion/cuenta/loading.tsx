export default function CuentaLoading() {
  return (
    <div className="p-6 space-y-5 max-w-2xl animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-4 w-48 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Profile section */}
      <div className="rounded-2xl p-6 space-y-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="space-y-2">
            <div className="h-5 w-36 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        </div>
        {/* Form fields */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-10 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.1)" }} />
          </div>
        ))}
        <div className="h-9 w-28 rounded-xl" style={{ background: "rgba(124,58,237,0.15)" }} />
      </div>

      {/* Password section */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="h-4 w-36 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-10 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.1)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
