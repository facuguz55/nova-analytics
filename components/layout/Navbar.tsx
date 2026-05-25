"use client";

import { Bell, Search, ChevronDown, Plus, Pencil, TrendingUp, DollarSign, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface NavbarProps {
  userName: string;
  avatarUrl?: string | null;
  alertCount?: number;
}

const CURRENCIES = ["ARS", "USD", "BRL", "MXN", "COP", "CLP", "EUR", "UYU", "PEN"];

export default function Navbar({ userName, avatarUrl, alertCount = 0 }: NavbarProps) {
  const [currency, setCurrency] = useState("ARS");
  const [showCurrency, setShowCurrency] = useState(false);
  const [showSecciones, setShowSecciones] = useState(false);
  const [tendencias, setTendencias] = useState(true);
  const [redondeo, setRedondeo] = useState(true);
  const currencyRef = useRef<HTMLDivElement>(null);
  const seccionesRef = useRef<HTMLDivElement>(null);

  const initials = userName.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

  // Persistir en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nova-currency");
    if (saved && CURRENCIES.includes(saved)) setCurrency(saved);
    const t = localStorage.getItem("nova-tendencias");
    if (t !== null) setTendencias(t === "true");
    const r = localStorage.getItem("nova-redondeo");
    if (r !== null) setRedondeo(r === "true");
  }, []);

  function selectCurrency(c: string) {
    setCurrency(c);
    localStorage.setItem("nova-currency", c);
    setShowCurrency(false);
    window.dispatchEvent(new CustomEvent("nova-currency-change", { detail: c }));
  }

  function toggleTendencias() {
    const next = !tendencias;
    setTendencias(next);
    localStorage.setItem("nova-tendencias", String(next));
    window.dispatchEvent(new CustomEvent("nova-tendencias-change", { detail: next }));
  }

  function toggleRedondeo() {
    const next = !redondeo;
    setRedondeo(next);
    localStorage.setItem("nova-redondeo", String(next));
    window.dispatchEvent(new CustomEvent("nova-redondeo-change", { detail: next }));
  }

  // Cerrar al click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setShowCurrency(false);
      if (seccionesRef.current && !seccionesRef.current.contains(e.target as Node)) setShowSecciones(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0 gap-3"
      style={{ height: "64px", background: "#0d0d14", borderBottom: "1px solid rgba(124,58,237,0.15)" }}
    >
      {/* Left: search */}
      <div
        className="flex items-center gap-2 rounded-lg px-3"
        style={{ height: "36px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", minWidth: "200px" }}
      >
        <Search size={13} strokeWidth={2} className="text-[#64748B]" />
        <span className="text-xs text-[#64748B]">Buscar...</span>
        <span className="ml-auto text-[10px] text-[#475569] rounded px-1"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          ⌘K
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">

        {/* Currency selector */}
        <div ref={currencyRef} className="relative">
          <button
            onClick={() => { setShowCurrency(!showCurrency); setShowSecciones(false); }}
            className="flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all hover:bg-[rgba(124,58,237,0.1)]"
            style={{ height: "36px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", color: "#F1F5F9" }}
          >
            {currency}
            <ChevronDown size={11} strokeWidth={2.5} className={`transition-transform ${showCurrency ? "rotate-180" : ""}`} />
          </button>

          {showCurrency && (
            <div
              className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50 py-1"
              style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.25)", minWidth: "100px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
            >
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => selectCurrency(c)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold transition-colors hover:bg-[rgba(124,58,237,0.08)]"
                  style={{ color: c === currency ? "#8B5CF6" : "#94A3B8" }}
                >
                  {c}
                  {c === currency && <span className="text-[#7C3AED]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Secciones */}
        <div ref={seccionesRef} className="relative">
          <button
            onClick={() => { setShowSecciones(!showSecciones); setShowCurrency(false); }}
            className="flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all hover:bg-[rgba(124,58,237,0.1)]"
            style={{ height: "36px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", color: "#F1F5F9" }}
          >
            <LayoutGrid size={13} strokeWidth={2} />
            Secciones
          </button>

          {showSecciones && (
            <div
              className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50 py-2"
              style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.25)", minWidth: "200px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
            >
              <p className="px-4 py-1.5 text-[10px] font-semibold tracking-widest text-[#475569] uppercase">SECCIONES</p>

              <button className="w-full flex items-center gap-3 px-4 py-2 text-xs text-[#94A3B8] hover:bg-[rgba(124,58,237,0.06)] transition-colors">
                <Plus size={13} strokeWidth={2.5} color="#8B5CF6" />
                Crear sección
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 text-xs text-[#94A3B8] hover:bg-[rgba(124,58,237,0.06)] transition-colors">
                <Pencil size={13} strokeWidth={2} color="#94A3B8" />
                Editar secciones
              </button>

              <div className="mx-3 my-1 h-px" style={{ background: "rgba(124,58,237,0.12)" }} />

              {/* Tendencias toggle */}
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <TrendingUp size={13} strokeWidth={2} color="#94A3B8" />
                  <span className="text-xs text-[#94A3B8]">Tendencias</span>
                </div>
                <button
                  onClick={toggleTendencias}
                  className="relative flex-shrink-0 rounded-full transition-all duration-200"
                  style={{ width: "32px", height: "18px", background: tendencias ? "#7C3AED" : "rgba(100,116,139,0.3)" }}
                >
                  <span
                    className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
                    style={{ width: "14px", height: "14px", left: tendencias ? "15px" : "2px" }}
                  />
                </button>
              </div>

              {/* Redondeo toggle */}
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <DollarSign size={13} strokeWidth={2} color="#94A3B8" />
                  <span className="text-xs text-[#94A3B8]">Redondeo</span>
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
          <Link href="/app/alertas"
            className="flex items-center justify-center rounded-lg transition-all hover:bg-[rgba(124,58,237,0.1)]"
            style={{ width: "36px", height: "36px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", color: "#94A3B8", display: "flex" }}
          >
            <Bell size={14} strokeWidth={2} />
          </Link>
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white text-[9px] font-bold"
              style={{ width: "14px", height: "14px", background: "#7C3AED" }}>
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </div>

        {/* Avatar */}
        <Link href="/app/configuracion/cuenta"
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 cursor-pointer transition-all hover:bg-[rgba(124,58,237,0.1)]"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={userName} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)" }}>
              {initials}
            </div>
          )}
          <span className="text-sm font-medium text-[#F1F5F9]">{userName.split(" ")[0]}</span>
        </Link>
      </div>
    </header>
  );
}
