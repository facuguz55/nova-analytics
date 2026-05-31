export default function IaLoading() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="space-y-2">
        <div className="sk h-7 w-44 rounded-xl" />
        <div className="sk h-4 w-60 rounded" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)", minHeight: "420px" }}>
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <div className="sk w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 max-w-sm">
              <div className="sk h-3 w-full rounded" />
              <div className="sk h-3 rounded" style={{ width: "75%" }} />
              <div className="sk h-3 rounded" style={{ width: "60%" }} />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="sk h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="px-5 pb-5 mt-auto">
          <div className="sk h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
