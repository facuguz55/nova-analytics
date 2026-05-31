export default function MailsLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="space-y-2">
        <div className="sk h-7 w-36 rounded-xl" />
        <div className="sk h-4 w-52 rounded" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="sk h-3 w-24 rounded" />
            <div className="sk h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="sk h-4 w-28 rounded" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4"
            style={{ borderBottom: i < 7 ? "1px solid rgba(124,58,237,0.06)" : "none" }}>
            <div className="sk w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="sk h-3.5 w-32 rounded" />
                <div className="sk h-3 w-16 rounded" />
              </div>
              <div className="sk h-3 rounded" style={{ width: `${50 + (i % 4) * 12}%` }} />
              <div className="sk h-2.5 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
