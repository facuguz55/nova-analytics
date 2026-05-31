export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="sk h-8 w-56 rounded-xl" />
          <div className="sk h-4 w-36 rounded-lg" />
        </div>
        <div className="sk h-8 w-48 rounded-xl hidden md:block" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="flex items-center justify-between">
              <div className="sk h-3 w-24 rounded" />
              <div className="sk w-8 h-8 rounded-lg" />
            </div>
            <div className="sk h-8 w-32 rounded-lg" />
            <div className="sk h-3 w-40 rounded" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="sk h-3 w-32 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 space-y-3"
              style={{ borderRight: i < 2 ? "1px solid rgba(124,58,237,0.1)" : "none" }}>
              <div className="sk h-3 w-28 rounded" />
              <div className="sk h-8 w-20 rounded-lg" />
              <div className="sk h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="sk h-4 w-40 rounded mb-4" />
        <div className="sk h-52 w-full rounded-xl" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.1)" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="sk h-4 w-32 rounded" />
          <div className="sk h-3 w-16 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3"
            style={{ borderBottom: i < 4 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="sk w-2 h-2 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="sk h-3 w-36 rounded" />
              <div className="sk h-2.5 w-24 rounded" />
            </div>
            <div className="text-right space-y-1.5">
              <div className="sk h-3 w-20 rounded" />
              <div className="sk h-2.5 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
