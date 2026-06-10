// Fondo animado sutil: orbes violeta que derivan lento + grilla con paneo.
// Pure CSS (ver globals.css) — sin JS, respeta prefers-reduced-motion.
export default function AnimatedBackground() {
  return (
    <div className="nova-bg" aria-hidden="true">
      <div className="nova-bg-grid" />
      <div className="nova-bg-orb nova-bg-orb-1" />
      <div className="nova-bg-orb nova-bg-orb-2" />
      <div className="nova-bg-orb nova-bg-orb-3" />
    </div>
  );
}
