export default function ActividadLoading() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="space-y-2">
        <div className="sk h-7 w-36 rounded-xl" />
        <div className="sk h-4 w-52 rounded" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="sk h-4 w-28 rounded" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-3.5"
            style={{ borderBottom: i < 9 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="sk w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="sk h-3.5 rounded" style={{ width: `${50 + (i % 4) * 10}%` }} />
              <div className="sk h-3 w-24 rounded" />
            </div>
            <div className="sk h-3 w-20 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
