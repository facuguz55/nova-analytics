export default function LoadingComisiones() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded-xl bg-[#111118]" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-[#111118]" style={{ border: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="h-16 bg-[#1a1a2e]" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-3/4 rounded bg-[#1a1a2e]" />
            <div className="h-4 w-1/2 rounded bg-[#1a1a2e]" />
          </div>
        </div>
      ))}
    </div>
  );
}
