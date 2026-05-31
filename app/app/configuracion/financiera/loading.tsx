export default function FinancieraLoading() {
  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-3 px-6 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(124,58,237,0.15)", background: "#0a0a0f", height: "52px" }}
      >
        <div className="sk h-4 w-44 rounded" />
        <div className="flex gap-3 ml-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="sk h-3 w-20 rounded" />
          ))}
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="sk h-7 w-64 rounded" />
            <div className="sk h-4 w-96 rounded" />
          </div>
          <div className="sk h-9 w-32 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 space-y-4 h-[180px]"
              style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="sk w-10 h-10 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <div className="sk h-3.5 w-3/4 rounded" />
                  <div className="sk h-2.5 w-full rounded" />
                </div>
              </div>
              <div className="sk h-12 rounded-xl" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="sk xl:col-span-2 rounded-2xl h-[280px]" />
          <div className="sk rounded-2xl h-[280px]" />
        </div>
      </div>
    </div>
  );
}
