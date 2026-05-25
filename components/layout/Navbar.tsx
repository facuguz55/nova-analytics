"use client";

import { Bell, Search, ChevronDown, DollarSign, LayoutGrid, X, Sparkles, GraduationCap, Megaphone, Activity, Plug, BellRing, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CURRENT_VERSION } from "@/lib/changelog";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  userName: string;
  avatarUrl?: string | null;
  alertCount?: number;
}

// ── Índice de búsqueda global ────────────────────────────────────────────────
// keywords: términos extra que disparan este ítem aunque no estén en el label
const SEARCH_ITEMS = [
  { label: "Dashboard",           href: "/app/dashboard",                      category: "General",       keywords: ["inicio", "home", "métricas", "ventas", "revenue", "profit"] },
  { label: "IA Assistant",        href: "/app/ia",                             category: "General",       keywords: ["ia", "inteligencia", "chat", "claude", "ai", "consulta"] },
  { label: "Alertas",             href: "/app/alertas",                        category: "General",       keywords: ["avisos", "stock", "notificaciones", "warning", "peligro"] },
  { label: "Planes",              href: "/app/planes",                         category: "General",       keywords: ["suscripcion", "billing", "precio", "upgrade", "trial", "pro"] },
  { label: "Novedades",           href: "/app/changelog",                      category: "General",       keywords: ["changelog", "versiones", "updates", "actualizaciones", "nuevo"] },
  { label: "Tienda Web",          href: "/app/tienda",                         category: "Tienda",        keywords: ["tiendanube", "tienda", "store", "ecommerce"] },
  { label: "Análisis",            href: "/app/analisis",                       category: "Tienda",        keywords: ["analisis", "estadisticas", "stats", "datos", "reporte"] },
  { label: "Órdenes",             href: "/app/ordenes",                        category: "Tienda",        keywords: ["pedidos", "compras", "orders", "ventas", "pagadas", "canceladas"] },
  { label: "Productos / Stock",   href: "/app/productos",                      category: "Tienda",        keywords: ["inventario", "stock", "productos", "sku", "variantes", "precio"] },
  { label: "Clientes",            href: "/app/clientes",                       category: "Tienda",        keywords: ["clientes", "buyers", "vip", "recurrentes", "email", "contactos"] },
  { label: "Rentabilidad",        href: "/app/rentabilidad",                   category: "Tienda",        keywords: ["margen", "ganancia", "costos", "utilidad", "profit", "neto"] },
  { label: "Meta Ads",            href: "/app/meta-ads",                       category: "Marketing",     keywords: ["facebook", "instagram", "roas", "cpc", "campañas", "ads", "publicidad"] },
  { label: "Campañas",            href: "/app/campanas",                       category: "Marketing",     keywords: ["campañas", "marketing", "promociones", "email marketing"] },
  { label: "Mails",               href: "/app/mails",                          category: "Comunicación",  keywords: ["emails", "gmail", "correos", "inbox", "mensajes", "responder"] },
  { label: "Integraciones",       href: "/app/configuracion/integraciones",    category: "Configuración", keywords: ["conectar", "tiendanube", "gmail", "meta", "api", "oauth"] },
  { label: "Configuración Financiera", href: "/app/configuracion/financiera",  category: "Configuración", keywords: ["finanzas", "iva", "impuestos", "comision", "dolar", "tipo de cambio"] },
  { label: "Cotizaciones USD",    href: "/app/configuracion/cotizaciones",     category: "Configuración", keywords: ["dolar", "blue", "oficial", "cotizacion", "ccl", "mep"] },
  { label: "Costos Adicionales",  href: "/app/configuracion/costos-adicionales", category: "Configuración", keywords: ["costos fijos", "gastos", "logistica", "envio", "extra"] },
  { label: "Comisiones",          href: "/app/configuracion/comisiones",       category: "Configuración", keywords: ["mercadopago", "plataforma", "tarjeta", "comision"] },
  { label: "Mi Cuenta",           href: "/app/configuracion/cuenta",           category: "Configuración", keywords: ["perfil", "usuario", "contraseña", "nombre", "avatar"] },
  { label: "Notificaciones",      href: "/app/configuracion/notificaciones",   category: "Configuración", keywords: ["telegram", "whatsapp", "alertas", "email", "resumen diario"] },
];

export default function Navbar({ userName, avatarUrl, alertCount = 0 }: NavbarProps) {
  const [showSearch,    setShowSearch]    = useState(false);
  const [searchQ,       setSearchQ]       = useState("");
  const [showSecciones, setShowSecciones] = useState(false);
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const [redondeo,      setRedondeo]      = useState(true);
  const [modoSimple,    setModoSimple]    = useState(false);
  const [selected,      setSelected]      = useState(0);
  const inputRef     = useRef<HTMLInputElement>(null);
  const seccionesRef = useRef<HTMLDivElement>(null);
  const userMenuRef  = useRef<HTMLDivElement>(null);
  const router       = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = userName.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

  const filtered = searchQ.trim()
    ? SEARCH_ITEMS.filter((i) => {
        const q = searchQ.toLowerCase();
        return (
          i.label.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
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

  // Cerrar dropdowns al click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (seccionesRef.current && !seccionesRef.current.contains(e.target as Node)) setShowSecciones(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
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

          {/* Badge Novedades */}
          <Link
            href="/app/changelog"
            className="flex items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-all hover:opacity-85"
            style={{ height: "36px", background: "rgba(225,105,30,0.15)", border: "1px solid rgba(225,105,30,0.35)", color: "#e1691e" }}
            title="Ver novedades de la versión"
          >
            <Megaphone size={12} strokeWidth={2.5} />
            v{CURRENT_VERSION}
          </Link>

          {/* Actividad */}
          <Link
            href="/app/configuracion/actividad"
            className="flex items-center justify-center rounded-lg transition-all hover:bg-[rgba(124,58,237,0.1)]"
            style={{ width: "36px", height: "36px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", color: "#94A3B8" }}
            title="Registro de actividad"
          >
            <Activity size={14} strokeWidth={2} />
          </Link>

          {/* Alertas */}
          <div className="relative">
            <Link
              href="/app/alertas"
              className="flex items-center justify-center rounded-lg transition-all hover:bg-[rgba(124,58,237,0.1)]"
              style={{ width: "36px", height: "36px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", color: "#94A3B8", display: "flex" }}
              title="Alertas"
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

          {/* Avatar + menú de cuenta */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 cursor-pointer transition-all hover:bg-[rgba(124,58,237,0.1)]"
              style={{ background: showUserMenu ? "rgba(124,58,237,0.12)" : "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
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
              <ChevronDown size={11} strokeWidth={2.5} className={`text-[#64748B] transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50 py-1.5"
                style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.25)", minWidth: "200px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
              >
                <p className="px-4 pt-2 pb-1.5 text-[10px] font-semibold tracking-widest text-[#475569] uppercase">Mi cuenta</p>
                {[
                  { href: "/app/configuracion/cuenta",          label: "Perfil",          icon: User },
                  { href: "/app/configuracion/integraciones",   label: "Integraciones",   icon: Plug },
                  { href: "/app/configuracion/financiera",      label: "Finanzas",        icon: DollarSign },
                  { href: "/app/configuracion/notificaciones",  label: "Notificaciones",  icon: BellRing },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[rgba(124,58,237,0.06)]"
                    >
                      <Icon size={13} strokeWidth={2} className="flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
                <div className="mx-3 my-1 h-px" style={{ background: "rgba(124,58,237,0.1)" }} />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors text-[#ef4444] hover:bg-[rgba(239,68,68,0.06)]"
                >
                  <LogOut size={13} strokeWidth={2} className="flex-shrink-0" />
                  <span className="text-sm">Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
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
