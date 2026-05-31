export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0a0a0f" }}>
      <div className="w-full max-w-lg flex flex-col gap-8">
        <div className="flex justify-center">
          <div className="sk h-8 w-44 rounded-xl" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="sk h-7 w-64 rounded-xl" />
          <div className="sk h-4 w-72 rounded" />
        </div>

        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="sk h-7 w-24 rounded-full" />
              {i < 2 && <div className="sk w-6 h-px" />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-7 space-y-6" style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex items-center gap-4">
            <div className="sk w-16 h-16 rounded-2xl flex-shrink-0" />
            <div className="space-y-2">
              <div className="sk h-6 w-32 rounded" />
              <div className="sk h-3 w-48 rounded" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="sk h-3 w-full rounded" />
            <div className="sk h-3 rounded" style={{ width: "85%" }} />
          </div>
          <div className="space-y-3">
            <div className="sk h-12 w-full rounded-xl" />
            <div className="sk h-10 w-full rounded-xl" />
          </div>
        </div>

        <div className="sk h-3 w-72 rounded mx-auto" />
      </div>
    </div>
  );
}
