export default function LoadingComisiones() {
  return (
    <div className="p-6 space-y-6">
      <div className="sk h-8 w-56 rounded-xl" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="sk h-16 w-full" />
          <div className="p-5 space-y-3">
            <div className="sk h-4 w-3/4 rounded" />
            <div className="sk h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
