export default function IntegracionesLoading() {
  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="space-y-2">
        <div className="sk h-7 w-36 rounded-xl" />
        <div className="sk h-4 w-52 rounded" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="sk w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="sk h-4 w-32 rounded" />
              <div className="sk h-3 w-48 rounded" />
            </div>
            <div className="sk h-6 w-20 rounded-full" />
          </div>
          <div className="sk h-px w-full mb-4" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="sk h-3 w-20 rounded" />
              <div className="sk h-9 w-full rounded-lg" />
            </div>
            <div className="sk h-9 w-32 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
