export default function CampanasLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="sk h-7 w-32 rounded-xl" />
          <div className="sk h-4 w-52 rounded" />
        </div>
        <div className="sk h-9 w-40 rounded-xl" />
      </div>

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 space-y-4" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <div className="sk h-4 rounded" style={{ width: `${45 + (i % 3) * 15}%` }} />
              <div className="sk h-3 w-40 rounded" />
            </div>
            <div className="sk h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <div className="sk h-2.5 w-16 rounded" />
                <div className="sk h-5 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
