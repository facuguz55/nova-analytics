export default function LoadingCotizaciones() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-[#111118]" />
      <div className="rounded-2xl p-6 space-y-4 bg-[#111118]" style={{ border: "1px solid rgba(124,58,237,0.1)" }}>
        <div className="h-4 w-40 rounded bg-[#1a1a2e]" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 w-28 rounded-xl bg-[#1a1a2e]" />)}
        </div>
        <div className="h-10 w-48 rounded-xl bg-[#1a1a2e]" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-[#111118]" />)}
      </div>
      <div className="h-64 rounded-2xl bg-[#111118]" />
    </div>
  );
}
