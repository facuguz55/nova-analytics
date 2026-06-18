export default function LocalLoading() {
  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-36 rounded-lg bg-white/10 mb-2" />
          <div className="h-4 w-48 rounded-lg bg-white/5" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-white/10" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 h-32" style={{ background: "#111118" }} />
        ))}
      </div>
      <div className="rounded-2xl h-64" style={{ background: "#111118" }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl h-52" style={{ background: "#111118" }} />
        <div className="rounded-2xl h-52" style={{ background: "#111118" }} />
      </div>
    </div>
  );
}
