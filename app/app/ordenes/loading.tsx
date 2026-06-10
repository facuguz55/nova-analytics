export default function OrdenesLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="sk h-7 w-32 rounded-xl" />
          <div className="sk h-4 w-44 rounded" />
        </div>
        <div className="sk h-9 w-36 rounded-xl" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="sk h-8 rounded-lg" style={{ width: `${56 + i * 8}px` }} />
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="grid grid-cols-5 gap-4 px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="sk h-3 w-16 rounded" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 items-center px-5 py-3.5"
            style={{ borderBottom: i < 9 ? "1px solid rgba(139,92,246,0.06)" : "none" }}>
            <div className="sk h-3 w-14 rounded" />
            <div className="space-y-1">
              <div className="sk h-3 rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
              <div className="sk h-2.5 w-24 rounded" />
            </div>
            <div className="sk h-3 w-16 rounded" />
            <div className="sk h-5 w-16 rounded-full" />
            <div className="sk h-3 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
