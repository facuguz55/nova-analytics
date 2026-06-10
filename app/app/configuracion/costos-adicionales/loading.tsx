export default function LoadingCostosAdicionales() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-8 w-52 rounded-xl bg-[#111118]" />
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-xl bg-[#111118]" />
          <div className="h-9 w-36 rounded-xl bg-[#111118]" />
        </div>
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-[#111118]" style={{ border: "1px solid rgba(139,92,246,0.1)" }}>
          <div className="h-12 bg-[#1a1a2e]" />
          <div className="p-5 h-32" />
        </div>
      ))}
    </div>
  );
}
