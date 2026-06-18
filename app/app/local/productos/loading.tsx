export default function ProductosLoading() {
  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-48 rounded-lg bg-white/10 mb-2" />
          <div className="h-4 w-28 rounded-lg bg-white/5" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-white/10" />
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="h-4 w-36 rounded bg-white/10" />
            <div className="h-4 w-16 rounded bg-white/5" />
            <div className="h-4 w-20 rounded bg-white/5" />
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="h-4 w-10 rounded bg-white/10" />
            <div className="h-4 w-10 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
