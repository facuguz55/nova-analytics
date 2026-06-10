export default function ClientesLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="sk h-7 w-32 rounded-xl" />
          <div className="sk h-4 w-48 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="sk h-3 w-28 rounded" />
            <div className="sk h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
          <div className="sk h-4 w-24 rounded" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5"
            style={{ borderBottom: i < 9 ? "1px solid rgba(139,92,246,0.06)" : "none" }}>
            <div className="sk w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="sk h-3.5 rounded" style={{ width: `${40 + (i % 4) * 10}%` }} />
              <div className="sk h-2.5 w-32 rounded" />
            </div>
            <div className="text-right space-y-1.5">
              <div className="sk h-3.5 w-20 rounded" />
              <div className="sk h-2.5 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
