export default function PlanesLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="text-center space-y-2">
        <div className="sk h-8 w-56 rounded-xl mx-auto" />
        <div className="sk h-4 w-80 rounded mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-6 space-y-5" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
            <div className="space-y-2">
              <div className="sk h-5 w-24 rounded-lg" />
              <div className="sk h-8 w-32 rounded" />
              <div className="sk h-3 w-40 rounded" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="sk w-4 h-4 rounded-full flex-shrink-0" />
                  <div className="sk h-3 rounded flex-1" style={{ width: `${60 + (j % 3) * 12}%` }} />
                </div>
              ))}
            </div>
            <div className="sk h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
