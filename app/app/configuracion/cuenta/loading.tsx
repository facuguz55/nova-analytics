export default function CuentaLoading() {
  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="space-y-2">
        <div className="sk h-7 w-32 rounded-xl" />
        <div className="sk h-4 w-48 rounded" />
      </div>

      <div className="rounded-2xl p-6 space-y-5" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="flex items-center gap-4">
          <div className="sk w-16 h-16 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <div className="sk h-5 w-36 rounded-lg" />
            <div className="sk h-3 w-28 rounded" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="sk h-3 w-20 rounded" />
            <div className="sk h-10 w-full rounded-xl" />
          </div>
        ))}
        <div className="sk h-9 w-28 rounded-xl" />
      </div>

      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="sk h-4 w-36 rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="sk h-3 w-24 rounded" />
            <div className="sk h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
