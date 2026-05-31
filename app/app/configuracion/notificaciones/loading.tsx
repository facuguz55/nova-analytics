export default function NotificacionesLoading() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="space-y-2">
        <div className="sk h-7 w-44 rounded-xl" />
        <div className="sk h-4 w-60 rounded" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-6 space-y-4" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="sk w-9 h-9 rounded-xl" />
              <div className="space-y-1.5">
                <div className="sk h-4 w-32 rounded" />
                <div className="sk h-3 w-48 rounded" />
              </div>
            </div>
            <div className="sk h-6 w-10 rounded-full" />
          </div>
          <div className="sk h-10 w-full rounded-xl" />
        </div>
      ))}

      <div className="sk h-10 w-36 rounded-xl" />
    </div>
  );
}
