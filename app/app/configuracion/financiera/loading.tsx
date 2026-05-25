export default function FinancieraLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Tab bar */}
      <div
        className="flex items-center gap-3 px-6 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(124,58,237,0.15)", background: "#0a0a0f", height: "52px" }}
      >
        <div className="h-4 w-44 rounded" style={{ background: "rgba(124,58,237,0.15)" }} />
        <div className="flex gap-3 ml-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 w-20 rounded" style={{ background: "rgba(124,58,237,0.08)" }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded" style={{ background: "rgba(124,58,237,0.15)" }} />
            <div className="h-4 w-96 rounded" style={{ background: "rgba(124,58,237,0.08)" }} />
          </div>
          <div className="h-9 w-32 rounded-xl" style={{ background: "rgba(34,197,94,0.08)" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 space-y-4 h-[180px]"
              style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl" style={{ background: "rgba(124,58,237,0.15)" }} />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-3/4 rounded" style={{ background: "rgba(124,58,237,0.12)" }} />
                  <div className="h-2.5 w-full rounded" style={{ background: "rgba(124,58,237,0.06)" }} />
                </div>
              </div>
              <div className="h-12 rounded-xl" style={{ background: "rgba(124,58,237,0.08)" }} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div
            className="xl:col-span-2 rounded-2xl p-6 h-[280px]"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          />
          <div
            className="rounded-2xl p-6 h-[280px]"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}
          />
        </div>
      </div>
    </div>
  );
}
