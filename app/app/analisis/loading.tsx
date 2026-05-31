export default function AnalisisLoading() {
  return (
    <div className="p-6 space-y-6 max-w-screen-xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="sk h-7 w-32 rounded-xl" />
          <div className="sk h-4 w-52 rounded" />
        </div>
        <div className="sk h-9 w-48 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="sk h-3 w-24 rounded" />
            <div className="sk h-7 w-20 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="sk h-4 w-40 rounded mb-4" />
        <div className="sk h-52 w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="sk h-4 w-36 rounded mb-4" />
            <div className="sk h-44 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
