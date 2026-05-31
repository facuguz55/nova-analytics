export default function AlertasLoading() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="sk h-7 w-28 rounded-xl" />
          <div className="sk h-4 w-52 rounded" />
        </div>
        <div className="sk h-9 w-36 rounded-xl" />
      </div>

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="sk w-9 h-9 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="sk h-4 rounded" style={{ width: `${50 + (i % 3) * 15}%` }} />
              <div className="sk h-3 w-32 rounded" />
            </div>
            <div className="sk h-6 w-16 rounded-full" />
          </div>
          <div className="sk h-3 w-full rounded" />
          <div className="sk h-3 rounded" style={{ width: "70%" }} />
        </div>
      ))}
    </div>
  );
}
