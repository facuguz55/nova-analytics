export default function RentabilidadLoading() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="sk h-7 w-36 rounded-xl" />
          <div className="sk h-4 w-56 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="sk h-9 w-32 rounded-xl" />
          <div className="sk h-9 w-24 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="sk w-8 h-8 rounded-lg" />
            <div className="sk h-6 w-24 rounded-lg" />
            <div className="sk h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="sk h-4 w-40 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="sk h-3 w-20 rounded" />
              <div className="sk h-8 w-28 rounded-lg" />
              <div className="sk h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="sk h-4 w-44 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: i < 4 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="flex items-center gap-2">
              <div className="sk w-2 h-2 rounded-full" />
              <div className="sk h-3 w-36 rounded" />
            </div>
            <div className="sk h-3 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
