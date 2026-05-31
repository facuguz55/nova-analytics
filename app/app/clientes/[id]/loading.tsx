export default function ClienteDetalleLoading() {
  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="sk w-4 h-4 rounded" />
        <div className="sk h-4 w-24 rounded" />
      </div>

      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
        <div className="flex items-center gap-4">
          <div className="sk w-14 h-14 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <div className="sk h-6 w-40 rounded" />
            <div className="sk h-3 w-32 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="sk h-3 w-20 rounded" />
              <div className="sk h-5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="sk h-4 w-32 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5"
            style={{ borderBottom: i < 5 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="sk h-3 w-20 rounded" />
            <div className="flex-1 space-y-1">
              <div className="sk h-3 rounded" style={{ width: `${50 + (i % 3) * 15}%` }} />
            </div>
            <div className="sk h-3 w-16 rounded" />
            <div className="sk h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
