"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2, Check, X, ChevronLeft, User, Loader2 } from "lucide-react";
import { registerLocalSale, lookupCustomerByDNI, type SaleItem } from "../../actions";

type Product = { id: string; name: string; sku: string | null; price: number; cost: number; stock: number; category: string | null };

const PAYMENT_OPTIONS = [
  { value: "efectivo",      label: "Efectivo",       color: "#22c55e" },
  { value: "transferencia", label: "Transferencia",  color: "#2563eb" },
  { value: "debito",        label: "Débito",         color: "#f59e0b" },
  { value: "credito",       label: "Crédito",        color: "#a855f7" },
  { value: "cuotas",        label: "Cuotas",         color: "#e1691e" },
];

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

type FoundCustomer = { id: string; name: string; phone: string | null; email: string | null; sales_count: number };
type CustomerState = "idle" | "searching" | "found" | "new";

const CARD: React.CSSProperties = { background: "#111118", border: "1px solid rgba(124,58,237,0.15)" };

export default function NuevaVentaClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [mode, setMode]             = useState<"catalog" | "manual">("catalog");
  const [search, setSearch]         = useState("");
  const [items, setItems]           = useState<SaleItem[]>([]);
  const [payment, setPayment]       = useState("efectivo");
  const [installments, setInstallments] = useState(3);
  const [notes, setNotes]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState("");

  // — Cliente —
  const [dni,            setDni]            = useState("");
  const [customerState,  setCustomerState]  = useState<CustomerState>("idle");
  const [foundCustomer,  setFoundCustomer]  = useState<FoundCustomer | null>(null);
  const [newName,        setNewName]        = useState("");
  const [newPhone,       setNewPhone]       = useState("");
  const dniTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Manual mode
  const [manName,  setManName]  = useState("");
  const [manPrice, setManPrice] = useState("");
  const [manQty,   setManQty]   = useState(1);

  const total = items.reduce((a, it) => a + it.unit_price * it.quantity, 0);

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
  });

  function addFromCatalog(p: Product) {
    const idx = items.findIndex((it) => it.product_id === p.id);
    if (idx >= 0) {
      setItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it));
    } else {
      setItems((prev) => [...prev, { product_id: p.id, product_name: p.name, unit_price: Number(p.price), unit_cost: Number(p.cost), quantity: 1 }]);
    }
    setSearch("");
  }

  function addManual() {
    const price = parseFloat(manPrice.replace(/\./g, "").replace(",", "."));
    if (!manName.trim() || isNaN(price) || price <= 0) return;
    setItems((prev) => [...prev, { product_id: null, product_name: manName.trim(), unit_price: price, unit_cost: 0, quantity: manQty }]);
    setManName(""); setManPrice(""); setManQty(1);
  }

  function removeItem(i: number) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateQty(i: number, qty: number) {
    if (qty < 1) return;
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, quantity: qty } : it));
  }

  // — DNI lookup —
  function handleDniChange(val: string) {
    setDni(val);
    setCustomerState("idle");
    setFoundCustomer(null);
    clearTimeout(dniTimer.current);
    const clean = val.replace(/\D/g, "");
    if (clean.length >= 7) {
      setCustomerState("searching");
      dniTimer.current = setTimeout(async () => {
        const found = await lookupCustomerByDNI(clean);
        if (found) {
          setFoundCustomer(found);
          setCustomerState("found");
        } else {
          setCustomerState("new");
        }
      }, 500);
    }
  }

  function resetCustomer() {
    setDni(""); setCustomerState("idle"); setFoundCustomer(null);
    setNewName(""); setNewPhone("");
  }

  // — Submit —
  async function handleSubmit() {
    if (items.length === 0) { setError("Agregá al menos un producto."); return; }
    if (customerState === "new" && !newName.trim()) { setError("Ingresá el nombre del cliente o dejá el campo DNI vacío."); return; }
    setLoading(true); setError("");
    try {
      const customer =
        customerState === "found" && foundCustomer
          ? { id: foundCustomer.id }
          : customerState === "new" && newName.trim()
          ? { dni: dni.replace(/\D/g, "") || undefined, name: newName.trim(), phone: newPhone.trim() || undefined }
          : null;

      await registerLocalSale({
        payment_method: payment,
        installments:   payment === "cuotas" ? installments : undefined,
        notes:          notes.trim() || undefined,
        items,
        customer,
      });
      setSuccess(true);
      setTimeout(() => router.push("/app/local"), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar la venta");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in duration-300"
          style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e" }}>
          <Check size={36} className="text-[#22c55e]" />
        </div>
        <p className="text-xl font-bold text-[#F1F5F9]">Venta registrada</p>
        <p className="text-[#94A3B8] text-sm">{fmt(total)}</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl text-[#64748B] hover:text-[#94A3B8] hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-[#F1F5F9]">Registrar venta</h1>
      </div>

      {/* Tabs de modo */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "rgba(255,255,255,0.05)" }}>
        {(["catalog", "manual"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: mode === m ? "#e1691e" : "transparent", color: mode === m ? "#fff" : "#94A3B8" }}>
            {m === "catalog" ? "Desde catálogo" : "Carga manual"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Selector de productos */}
        {mode === "catalog" ? (
          <div className="rounded-2xl p-4" style={CARD}>
            <h3 className="text-sm font-medium text-[#94A3B8] mb-3">Buscar producto</h3>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre o SKU…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.15)" }} />
            </div>
            {products.length === 0 ? (
              <p className="text-sm text-[#64748B] text-center py-4">
                No tenés productos en el catálogo.{" "}
                <a href="/app/local/productos" className="text-[#a855f7] hover:underline">Agregar productos</a>
              </p>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-1">
                {filteredProducts.slice(0, 20).map((p) => (
                  <button key={p.id} onClick={() => addFromCatalog(p)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/5"
                    style={{ border: "1px solid transparent" }}>
                    <div>
                      <p className="text-sm text-[#F1F5F9] font-medium">{p.name}</p>
                      <p className="text-xs text-[#64748B]">{p.sku ? `${p.sku} · ` : ""}{fmt(Number(p.price))} · Stock: {p.stock}</p>
                    </div>
                    <Plus size={16} className="text-[#e1691e] flex-shrink-0" />
                  </button>
                ))}
                {filteredProducts.length === 0 && search && (
                  <p className="text-sm text-[#64748B] text-center py-3">Sin resultados</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-4 space-y-3" style={CARD}>
            <h3 className="text-sm font-medium text-[#94A3B8]">Producto manual</h3>
            <input value={manName} onChange={(e) => setManName(e.target.value)} placeholder="Nombre del producto"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.15)" }} />
            <div className="flex gap-2">
              <input value={manPrice} onChange={(e) => setManPrice(e.target.value)} placeholder="Precio"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.15)" }} />
              <input type="number" min={1} value={manQty} onChange={(e) => setManQty(Number(e.target.value))}
                className="w-20 px-3 py-2.5 rounded-xl text-sm text-[#F1F5F9] text-center focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.15)" }} />
              <button onClick={addManual} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "#e1691e" }}>
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm font-medium text-[#94A3B8]">Productos en esta venta</p>
            </div>
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F1F5F9] truncate">{it.product_name}</p>
                  <p className="text-xs text-[#64748B]">{fmt(it.unit_price)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(i, it.quantity - 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors">−</button>
                  <span className="w-8 text-center text-sm font-medium text-[#F1F5F9]">{it.quantity}</span>
                  <button onClick={() => updateQty(i, it.quantity + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors">+</button>
                </div>
                <p className="text-sm font-bold text-[#F1F5F9] w-20 text-right">{fmt(it.unit_price * it.quantity)}</p>
                <button onClick={() => removeItem(i)} className="text-[#ef4444] hover:opacity-80 transition-opacity"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}

        {/* ── CLIENTE ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-4" style={CARD}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#e1691e]" />
              <h3 className="text-sm font-medium text-[#94A3B8]">Cliente</h3>
            </div>
            {(customerState !== "idle" || dni) && (
              <button onClick={resetCustomer} className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">
                Limpiar
              </button>
            )}
          </div>

          {/* DNI Input */}
          <div className="relative mb-3">
            <input
              value={dni}
              onChange={(e) => handleDniChange(e.target.value)}
              placeholder="DNI (buscá cliente existente)"
              maxLength={12}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {customerState === "searching" && <Loader2 size={14} className="text-[#64748B] animate-spin" />}
              {customerState === "found"     && <Check    size={14} className="text-[#22c55e]" />}
              {customerState === "new"       && <User     size={14} className="text-[#e1691e]" />}
            </div>
          </div>

          {/* Cliente encontrado */}
          {customerState === "found" && foundCustomer && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}>
                {foundCustomer.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#F1F5F9] truncate">{foundCustomer.name}</p>
                <p className="text-xs text-[#64748B]">
                  {foundCustomer.phone ? `${foundCustomer.phone} · ` : ""}
                  {foundCustomer.sales_count} compra{foundCustomer.sales_count !== 1 ? "s" : ""} anteriores
                </p>
              </div>
              <Check size={16} className="text-[#22c55e] flex-shrink-0" />
            </div>
          )}

          {/* Cliente nuevo */}
          {customerState === "new" && (
            <div className="space-y-2">
              <p className="text-xs text-[#e1691e] font-medium">DNI no registrado — completá los datos</p>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre y apellido *"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}
              />
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Teléfono (opcional)"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}
              />
            </div>
          )}

          {customerState === "idle" && !dni && (
            <p className="text-xs text-[#475569]">
              Ingresá el DNI para identificar al cliente o crear un registro nuevo.
            </p>
          )}
        </div>
        {/* ────────────────────────────────────────────────────────────── */}

        {/* Método de pago */}
        <div className="rounded-2xl p-4" style={CARD}>
          <h3 className="text-sm font-medium text-[#94A3B8] mb-3">Método de pago</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setPayment(opt.value)}
                className="py-2.5 px-2 rounded-xl text-xs font-medium transition-all text-center"
                style={{
                  background: payment === opt.value ? `${opt.color}20` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${payment === opt.value ? opt.color : "rgba(255,255,255,0.06)"}`,
                  color: payment === opt.value ? opt.color : "#64748B",
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          {payment === "cuotas" && (
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs text-[#94A3B8]">Cuotas:</label>
              <input type="number" min={2} max={72} value={installments} onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-xl text-sm text-[#F1F5F9] text-center focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)" }} />
            </div>
          )}
        </div>

        {/* Notas */}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionales…" rows={2}
          className="w-full px-4 py-3 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none resize-none"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }} />

        {/* Error */}
        {error && (
          <p className="text-sm text-[#ef4444] flex items-center gap-2">
            <X size={14} /> {error}
          </p>
        )}

        {/* Total y confirmar */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(225,105,30,0.08)", border: "1px solid rgba(225,105,30,0.2)" }}>
          {(customerState === "found" && foundCustomer) || (customerState === "new" && newName.trim()) ? (
            <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <User size={13} className="text-[#e1691e]" />
              <span className="text-sm text-[#94A3B8]">
                {customerState === "found" ? foundCustomer!.name : newName.trim()}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#94A3B8] font-medium">Total</span>
            <span className="text-2xl font-bold text-[#F1F5F9]">{fmt(total)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}>
            {loading ? "Guardando…" : "Confirmar venta"}
          </button>
        </div>
      </div>
    </div>
  );
}
