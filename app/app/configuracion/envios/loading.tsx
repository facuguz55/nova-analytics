export default function LoadingEnvios() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-44 rounded-xl bg-[#111118]" />
      <div className="rounded-2xl p-6 space-y-3 bg-[#111118]" style={{ border: "1px solid rgba(139,92,246,0.1)" }}>
        {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-[#1a1a2e]" />)}
      </div>
    </div>
  );
}
