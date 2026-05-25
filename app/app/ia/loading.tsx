export default function IaLoading() {
  return (
    <div className="p-6 space-y-5 max-w-3xl animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-44 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-4 w-60 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Chat area */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)", minHeight: "420px" }}>
        <div className="p-5 space-y-4">
          {/* AI message */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: "rgba(124,58,237,0.2)" }} />
            <div className="flex-1 space-y-2 max-w-sm">
              <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="h-3 rounded" style={{ width: "75%", background: "rgba(255,255,255,0.05)" }} />
              <div className="h-3 rounded" style={{ width: "60%", background: "rgba(255,255,255,0.05)" }} />
            </div>
          </div>
          {/* Suggestions */}
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.1)" }} />
            ))}
          </div>
        </div>
        {/* Input area */}
        <div className="px-5 pb-5 mt-auto">
          <div className="h-12 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.15)" }} />
        </div>
      </div>
    </div>
  );
}
