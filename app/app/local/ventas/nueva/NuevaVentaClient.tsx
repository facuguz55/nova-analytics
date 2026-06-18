"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2, Check, X, ChevronLeft } from "lucide-react";
import { registerLocalSale, type SaleItem } from "../../actions";

type Product = { id: string; name: string; sku: string | null; price: number; cost: number; stock: number; category: string | null };

const PAYMENT_OPTIONS = [
  { value: "efectivo",      label: "Efectivo",       color: "#22c55e" },
  { value: "transferencia", label: "Transferencia",  color: "#2563eb" },
  { value: "debito",        label: "Débito",         color: "#f59e0b" },
  { value: "credito",       label: "Crédito",        color: "#a855f7" },
  { value: "cuotas",        label: "Cuotas",         color: "#e1691e" },
];

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

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

  // Manual mode fields
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
    const exists = items.findIndex((it) => it.product_id === p.id);
    if (exists >= 0) {
      setItems((prev) => prev.map((it, i) => i === exists ? { ...it, quantity: it.quantity + 1 } : it));
    } else {
      setItems((prev) => [...prev, {
        product_id:   p.id,
        product_name: p.name,
        unit_price:   Number(p.price),
        unit_cost:    Number(p.cost),
        quantity:     1,
      }]);
    }
    setSearch("");
  }

  function addManual() {
    const price = parseFloat(manPrice.replace(/\./g, "").replace(",", "."));
    if (!manName.trim() || isNaN(price) || price <= 0) return;
    setItems((prev) => [...prev, {
      product_id:   null,
      product_name: manName.trim(),
      unit_price:   price,
      unit_cost:    0,
      quantity:     manQty,
    }]);
    setManName(""); setManPrice(""); setManQty(1);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateQty(i: number, qty: number) {
    if (qty < 1) return;
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, quantity: qty } : it));
  }

  async function handleSubmit() {
    if (items.length === 0) { setError("Agregá al menos un producto."); return; }
    setLoading(true);
    setError("");
    try {
      await registerLocalSale({
        payment_method: payment,
        installments:   payment === "cuotas" ? installments : undefined,
        notes:          notes.trim() || undefined,
        items,
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
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in duration-300"
          style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e" }}
        >
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
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F9]">Registrar venta</h1>
        </div>
      </div>

      {/* Tabs de modo */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        {(["catalog", "manual"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: mode === m ? "#e1691e" : "transparent",
              color: mode === m ? "#fff" : "#94A3B8",
            }}
          >
            {m === "catalog" ? "Desde catálogo" : "Carga manual"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Selector de productos */}
        {mode === "catalog" ? (
          <div
            className="rounded-2xl p-4"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
          >
            <h3 className="text-sm font-medium text-[#94A3B8] mb-3">Buscar producto</h3>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o SKU…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}
              />
            </div>
            {products.length === 0 ? (
              <p className="text-sm text-[#64748B] text-center py-4">
                No tenés productos en el catálogo.{" "}
                <a href="/app/local/productos" className="text-[#a855f7] hover:underline">Agregar productos</a>
              </p>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-1">
                {filteredProducts.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addFromCatalog(p)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/5"
                    style={{ border: "1px solid transparent" }}
                  >
                    <div>
                      <p className="text-sm text-[#F1F5F9] font-medium">{p.name}</p>
                      <p className="text-xs text-[#64748B]">
                        {p.sku ? `${p.sku} · ` : ""}{fmt(Number(p.price))} · Stock: {p.stock}
                      </p>
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
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
          >
            <h3 className="text-sm font-medium text-[#94A3B8]">Producto manual</h3>
            <input
              value={manName}
              onChange={(e) => setManName(e.target.value)}
              placeholder="Nombre del producto"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}
            />
            <div className="flex gap-2">
              <input
                value={manPrice}
                onChange={(e) => setManPrice(e.target.value)}
                placeholder="Precio"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}
              />
              <input
                type="number"
                min={1}
                value={manQty}
                onChange={(e) => setManQty(Number(e.target.value))}
                className="w-20 px-3 py-2.5 rounded-xl text-sm text-[#F1F5F9] text-center focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}
              />
              <button
                onClick={addManual}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "#e1691e" }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Lista de ítems en la venta */}
        {items.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm font-medium text-[#94A3B8]">Productos en esta venta</p>
            </div>
            {items.map((it, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F1F5F9] truncate">{it.product_name}</p>
                  <p className="text-xs text-[#64748B]">{fmt(it.unit_price)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(i, it.quantity - 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-[#F1F5F9]">{it.quantity}</span>
                  <button
                    onClick={() => updateQty(i, it.quantity + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-bold text-[#F1F5F9] w-20 text-right">
                  {fmt(it.unit_price * it.quantity)}
                </p>
                <button onClick={() => removeItem(i)} className="text-[#ef4444] hover:opacity-80 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Método de pago */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <h3 className="text-sm font-medium text-[#94A3B8] mb-3">Método de pago</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPayment(opt.value)}
                className="py-2.5 px-2 rounded-xl text-xs font-medium transition-all text-center"
                style={{
                  background: payment === opt.value ? `${opt.color}20` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${payment === opt.value ? opt.color : "rgba(255,255,255,0.06)"}`,
                  color: payment === opt.value ? opt.color : "#64748B",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {payment === "cuotas" && (
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs text-[#94A3B8]">Cuotas:</label>
              <input
                type="number"
                min={2}
                max={72}
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-xl text-sm text-[#F1F5F9] text-center focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}
              />
            </div>
          )}
        </div>

        {/* Notas */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas opcionales…"
          rows={2}
          className="w-full px-4 py-3 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none resize-none"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        />

        {/* Error */}
        {error && (
          <p className="text-sm text-[#ef4444] flex items-center gap-2">
            <X size={14} /> {error}
          </p>
        )}

        {/* Total y confirmar */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(225,105,30,0.08)", border: "1px solid rgba(225,105,30,0.2)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#94A3B8] font-medium">Total</span>
            <span className="text-2xl font-bold text-[#F1F5F9]">{fmt(total)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}
          >
            {loading ? "Guardando…" : "Confirmar venta"}
          </button>
        </div>
      </div>
    </div>
  );
}
