export default function ConfiguracionLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="space-y-2">
        <div className="sk h-7 w-40 rounded-xl" />
        <div className="sk h-4 w-56 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="flex items-center gap-3">
              <div className="sk w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="sk h-4 w-28 rounded" />
                <div className="sk h-3 rounded" style={{ width: `${60 + (i % 3) * 12}%` }} />
              </div>
            </div>
            <div className="sk h-8 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
