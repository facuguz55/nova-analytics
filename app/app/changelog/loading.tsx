export default function ChangelogLoading() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="space-y-2">
        <div className="sk h-7 w-36 rounded-xl" />
        <div className="sk h-4 w-52 rounded" />
      </div>

      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="sk h-5 w-20 rounded-full" />
            <div className="sk h-3 w-24 rounded" />
          </div>
          <div className="sk h-5 rounded" style={{ width: `${55 + (i % 3) * 12}%` }} />
          <div className="space-y-2">
            <div className="sk h-3 w-full rounded" />
            <div className="sk h-3 rounded" style={{ width: "85%" }} />
            <div className="sk h-3 rounded" style={{ width: "70%" }} />
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <div className="sk w-1.5 h-1.5 rounded-full flex-shrink-0" />
                <div className="sk h-3 rounded" style={{ width: `${50 + (j % 4) * 10}%` }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
