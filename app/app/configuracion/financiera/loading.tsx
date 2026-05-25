export default function FinancieraLoading() {
  return (
    <div className="p-6 space-y-5 max-w-2xl animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-44 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-4 w-56 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Config section */}
      <div className="rounded-2xl p-6 space-y-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="h-4 w-32 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-10 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.1)" }} />
            <div className="h-2.5 w-64 rounded" style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
        ))}
        <div className="h-9 w-28 rounded-xl" style={{ background: "rgba(124,58,237,0.15)" }} />
      </div>
    </div>
  );
}
