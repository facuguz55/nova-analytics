"use client";

import { Bell, Search, ChevronDown, DollarSign, LayoutGrid, X, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  userName: string;
  avatarUrl?: string | null;
  alertCount?: number;
}

// ── Índice de búsqueda ────────────────────────────────────────────────────────
const SEARCH_ITEMS = [
  { label: "Dashboard",           href: "/app/dashboard",                      category: "General" },
  { label: "IA Assistant",        href: "/app/ia",                             category: "General" },
  { label: "Alertas",             href: "/app/alertas",                        category: "General" },
  { label: "Planes",              href: "/app/planes",                         category: "General" },
  { label: "Tienda Web",          href: "/app/tienda",                         category: "Tienda"  },
  { label: "Análisis",            href: "/app/analisis",                       category: "Tienda"  },
  { label: "Órdenes",             href: "/app/ordenes",                        category: "Tienda"  },
  { label: "Productos / Stock",   href: "/app/productos",                      category: "Tienda"  },
  { label: "Clientes",            href: "/app/clientes",                       category: "Tienda"  },
  { label: "Rentabilidad",        href: "/app/rentabilidad",                   category: "Tienda"  },
  { label: "Meta Ads",            href: "/app/meta-ads",                       category: "Marketing" },
  { label: "Campañas",            href: "/app/campanas",                       category: "Marketing" },
  { label: "Mails",               href: "/app/mails",                          category: "Comunicación" },
  { label: "Integraciones",       href: "/app/configuracion/integraciones",    category: "Config"  },
  { label: "Finanzas",            href: "/app/configuracion/financiera",       category: "Config"  },
  { label: "Mi Cuenta",           href: "/app/configuracion/cuenta",           category: "Config"  },
];

export default function Navbar({ userName, avatarUrl, alertCount = 0 }: NavbarProps) {
  const [showSearch, setShowSearch]     = useState(false);
  const [searchQ,    setSearchQ]        = useState("");
  const [showSecciones, setShowSecciones] = useState(false);
  const [redondeo,   setRedondeo]       = useState(true);
  const [modoSimple, setModoSimple]     = useState(false);
  const [selected,   setSelected]       = useState(0);
  const inputRef     = useRef<HTMLInputElement>(null);
  const seccionesRef = useRef<HTMLDivElement>(null);
  const router       = useRouter();

  const initials = userName.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

  const filtered = searchQ.trim()
    ? SEARCH_ITEMS.filter((i) =>
        i.label.toLowerCase().includes(searchQ.toLowerCase()) ||
        i.category.toLowerCase().includes(searchQ.toLowerCase())
      )
    : SEARCH_ITEMS.slice(0, 8);

  // Persistir preferencias
  useEffect(() => {
    const r = localStorage.getItem("nova-redondeo");
    if (r !== null) setRedondeo(r === "true");
    const s = localStorage.getItem("nova-modo-simple");
    if (s !== null) {
      const v = s === "true";
      setModoSimple(v);
      document.documentElement.setAttribute("data-modo", v ? "simple" : "pro");
    }
  }, []);

  // Abrir con Ctrl+K / ⌘K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setSearchQ("");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Reset selected when results change
  useEffect(() => { setSelected(0); }, [searchQ]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[selected]) {
      router.push(filtered[selected].href);
      setShowSearch(false);
      setSearchQ("");
    }
  }

  function openSearch() {
    setShowSearch(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function toggleRedondeo() {
    const next = !redondeo;
    setRedondeo(next);
    localStorage.setItem("nova-redondeo", String(next));
    window.dispatchEvent(new CustomEvent("nova-redondeo-change", { detail: next }));
  }

  function toggleModoSimple() {
    const next = !modoSimple;
    setModoSimple(next);
    localStorage.setItem("nova-modo-simple", String(next));
    document.documentElement.setAttribute("data-modo", next ? "simple" : "pro");
    window.dispatchEvent(new CustomEvent("nova-modo-change", { detail: next ? "simple" : "pro" }));
  }

  // Cerrar Secciones al click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (seccionesRef.current && !seccionesRef.current.contains(e.target as Node)) setShowSecciones(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <header
        className="flex items-center justify-between px-6 flex-shrink-0 gap-3"
        style={{ height: "64px", background: "#0d0d14", borderBottom: "1px solid rgba(124,58,237,0.15)" }}
      >
        {/* Search bar */}
        <button
          onClick={openSearch}
          className="flex items-center gap-2 rounded-lg px-3 transition-all hover:border-purple-500/40 hover:bg-purple-500/10"
          style={{
            height: "36px",
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.2)",
            minWidth: "220px",
            maxWidth: "340px",
            flex: 1,
          }}
        >
          <Search size={13} strokeWidth={2} className="text-[#64748B] flex-shrink-0" />
          <span className="text-xs text-[#64748B] flex-1 text-left">Buscar páginas y configuraciones...</span>
          <span
            className="text-[10px] text-[#475569] rounded px-1.5 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            ⌘K
          </span>
        </button>

        {/* Right */}
        <div className="flex items-center gap-2 ml-auto">

          {/* Secciones (solo Redondeo) */}
          <div ref={seccionesRef} className="relative">
            <button
              onClick={() => setShowSecciones(!showSecciones)}
              className="flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all hover:bg-[rgba(124,58,237,0.1)]"
              style={{ height: "36px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", color: "#F1F5F9" }}
            >
              <LayoutGrid size={13} strokeWidth={2} />
              Vista
              <ChevronDown size={11} strokeWidth={2.5} className={`transition-transform ${showSecciones ? "rotate-180" : ""}`} />
            </button>

            {showSecciones && (
              <div
                className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50 py-2"
                style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.25)", minWidth: "190px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
              >
                <p className="px-4 py-1.5 text-[10px] font-semibold tracking-widest text-[#475569] uppercase">MODO DE VISTA</p>

                {/* Modo Simple/Pro */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {modoSimple
                      ? <GraduationCap size={13} strokeWidth={2} color="#22c55e" />
                      : <Sparkles size={13} strokeWidth={2} color="#8B5CF6" />}
                    <div>
                      <p className="text-xs font-semibold text-[#F1F5F9]">{modoSimple ? "Modo Simple" : "Modo Pro"}</p>
                      <p className="text-[10px] text-[#475569]">
                        {modoSimple ? "Términos en español, sin jerga" : "Métricas técnicas completas"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleModoSimple}
                    className="relative flex-shrink-0 rounded-full transition-all duration-200"
                    style={{ width: "32px", height: "18px", background: modoSimple ? "#22c55e" : "#7C3AED" }}
                  >
                    <span
                      className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
                      style={{ width: "14px", height: "14px", left: modoSimple ? "15px" : "2px" }}
                    />
                  </button>
                </div>

                <div className="mx-3 my-1 h-px" style={{ background: "rgba(124,58,237,0.12)" }} />

                <p className="px-4 py-1.5 text-[10px] font-semibold tracking-widest text-[#475569] uppercase">PREFERENCIAS</p>

                {/* Redondeo toggle */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <DollarSign size={13} strokeWidth={2} color="#94A3B8" />
                    <div>
                      <p className="text-xs font-semibold text-[#94A3B8]">Redondeo</p>
                      <p className="text-[10px] text-[#475569]">Redondear montos al entero</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleRedondeo}
                    className="relative flex-shrink-0 rounded-full transition-all duration-200"
                    style={{ width: "32px", height: "18px", background: redondeo ? "#7C3AED" : "rgba(100,116,139,0.3)" }}
                  >
                    <span
                      className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
                      style={{ width: "14px", height: "14px", left: redondeo ? "15px" : "2px" }}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notificaciones */}
          <div className="relative">
            <Link
              href="/app/alertas"
              className="flex items-center justify-center rounded-lg transition-all hover:bg-[rgba(124,58,237,0.1)]"
              style={{ width: "36px", height: "36px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", color: "#94A3B8", display: "flex" }}
            >
              <Bell size={14} strokeWidth={2} />
            </Link>
            {alertCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white text-[9px] font-bold"
                style={{ width: "14px", height: "14px", background: "#7C3AED" }}
              >
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </div>

          {/* Avatar */}
          <Link
            href="/app/configuracion/cuenta"
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 cursor-pointer transition-all hover:bg-[rgba(124,58,237,0.1)]"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={userName} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}
              >
                {initials}
              </div>
            )}
            <span className="text-sm font-medium text-[#F1F5F9]">{userName.split(" ")[0]}</span>
          </Link>
        </div>
      </header>

      {/* ── Command Palette / Search Modal ──────────────────────────────────── */}
      {showSearch && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowSearch(false); setSearchQ(""); } }}
        >
          <div
            className="w-full max-w-xl rounded-2xl overflow-hidden"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
          >
            {/* Input */}
            <div
              className="flex items-center gap-3 px-4"
              style={{ borderBottom: "1px solid rgba(124,58,237,0.12)", height: "52px" }}
            >
              <Search size={16} strokeWidth={2} className="text-[#64748B] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar páginas, configuraciones..."
                className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]"
              />
              {searchQ && (
                <button onClick={() => setSearchQ("")} className="text-[#64748B] hover:text-[#94A3B8]">
                  <X size={14} strokeWidth={2} />
                </button>
              )}
              <button
                onClick={() => { setShowSearch(false); setSearchQ(""); }}
                className="text-[10px] text-[#475569] rounded px-1.5 py-0.5 hover:text-[#94A3B8]"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="py-2 max-h-[360px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[#64748B] text-center">Sin resultados para &quot;{searchQ}&quot;</p>
              ) : (
                <>
                  {/* Group by category */}
                  {(() => {
                    const cats = Array.from(new Set(filtered.map((i) => i.category)));
                    let globalIdx = 0;
                    return cats.map((cat) => {
                      const items = filtered.filter((i) => i.category === cat);
                      return (
                        <div key={cat}>
                          <p className="px-4 py-1 text-[10px] font-semibold tracking-widest text-[#475569] uppercase">
                            {cat}
                          </p>
                          {items.map((item) => {
                            const idx = globalIdx++;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => { setShowSearch(false); setSearchQ(""); }}
                                className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all"
                                style={{
                                  background: idx === selected ? "rgba(124,58,237,0.1)" : "transparent",
                                  border: `1px solid ${idx === selected ? "rgba(124,58,237,0.2)" : "transparent"}`,
                                }}
                                onMouseEnter={() => setSelected(idx)}
                              >
                                <span className="text-sm text-[#CBD5E1]">{item.label}</span>
                                <span className="ml-auto text-[10px] text-[#475569]">{item.href}</span>
                              </Link>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}
                </>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center gap-4 px-4 py-2.5 text-[10px] text-[#475569]"
              style={{ borderTop: "1px solid rgba(124,58,237,0.08)" }}
            >
              <span>↑↓ navegar</span>
              <span>↵ ir</span>
              <span>ESC cerrar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
