export default function ProductosLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="sk h-7 w-32 rounded-xl" />
          <div className="sk h-4 w-44 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="sk h-3 w-24 rounded" />
            <div className="sk h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.12)" }}>
            <div className="sk h-36 w-full" />
            <div className="p-4 space-y-2">
              <div className="sk h-4 rounded" style={{ width: `${60 + (i % 3) * 12}%` }} />
              <div className="sk h-3 w-20 rounded" />
              <div className="flex items-center justify-between pt-1">
                <div className="sk h-5 w-16 rounded-lg" />
                <div className="sk h-4 w-12 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
