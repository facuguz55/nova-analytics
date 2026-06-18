"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, AlertTriangle, X, Check, Package, RefreshCw } from "lucide-react";
import {
  createLocalProduct,
  updateLocalProduct,
  updateLocalProductStock,
  deleteLocalProduct,
  syncFromTiendaNube,
} from "../actions";

type Product = {
  id: string; name: string; sku: string | null; category: string | null;
  cost: number; price: number; stock: number; min_stock: number; created_at: string;
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
const margin = (cost: number, price: number) =>
  price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

const EMPTY: Omit<Product, "id" | "created_at"> = {
  name: "", sku: "", category: "", cost: 0, price: 0, stock: 0, min_stock: 3,
};

export default function LocalProductosClient({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [newStock, setNewStock]       = useState(0);
  const [error, setError]             = useState("");
  const [syncMsg, setSyncMsg]         = useState<{ text: string; ok: boolean } | null>(null);
  const [syncing, setSyncing]         = useState(false);
  const [isPending, startTransition]  = useTransition();

  function openNew() {
    setEditId(null);
    setForm({ ...EMPTY });
    setError("");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({ name: p.name, sku: p.sku ?? "", category: p.category ?? "", cost: p.cost, price: p.price, stock: p.stock, min_stock: p.min_stock });
    setError("");
    setShowForm(true);
  }

  function handleField(k: keyof typeof form, v: string | number) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function formToFormData() {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.set(k, String(v)));
    return fd;
  }

  function handleSave() {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    startTransition(async () => {
      try {
        if (editId) {
          await updateLocalProduct(editId, formToFormData());
        } else {
          await createLocalProduct(formToFormData());
        }
        setShowForm(false);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  function handleStockSave(id: string) {
    startTransition(async () => {
      try {
        await updateLocalProductStock(id, newStock);
        setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock: newStock } : p));
        setEditStockId(null);
      } catch {}
    });
  }

  async function handleTNSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { created, skipped } = await syncFromTiendaNube();
      setSyncMsg({
        text: created === 0
          ? `Todo al día — ${skipped} producto${skipped !== 1 ? "s" : ""} ya importado${skipped !== 1 ? "s" : ""}`
          : `${created} producto${created !== 1 ? "s" : ""} importado${created !== 1 ? "s" : ""} · ${skipped} ya existían`,
        ok: true,
      });
      // Recargar productos importados refrescando la página
      window.location.reload();
    } catch (e) {
      setSyncMsg({ text: e instanceof Error ? e.message : "Error al sincronizar", ok: false });
    } finally {
      setSyncing(false);
    }
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    startTransition(async () => {
      try {
        await deleteLocalProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch {}
    });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Catálogo de productos</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">{products.length} producto{products.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTNSync}
            disabled={syncing}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5 disabled:opacity-50"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8" }}
            title="Importar productos desde TiendaNube (no sobreescribe los existentes)"
          >
            <RefreshCw size={13} strokeWidth={2} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Importando…" : "Importar de TiendaNube"}
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}
          >
            <Plus size={16} /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Feedback del sync */}
      {syncMsg && (
        <div
          className="mb-4 flex items-center justify-between px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: syncMsg.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${syncMsg.ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            color: syncMsg.ok ? "#22c55e" : "#ef4444",
          }}
        >
          <span>{syncMsg.text}</span>
          <button onClick={() => setSyncMsg(null)} className="ml-4 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabla */}
      {products.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <Package size={40} className="text-[#334155] mb-3" />
          <p className="text-[#64748B] text-sm mb-4">No tenés productos en el catálogo</p>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "#e1691e" }}
          >
            <Plus size={14} /> Agregar producto
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Producto", "SKU", "Categoría", "Costo", "Precio", "Margen", "Stock", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[#64748B] font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const lowStock = p.stock <= p.min_stock;
                const m = margin(Number(p.cost), Number(p.price));
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lowStock && <AlertTriangle size={13} className="text-[#ef4444] flex-shrink-0" />}
                        <span className="font-medium text-[#F1F5F9]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{p.sku || "—"}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">{p.category || "—"}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">{fmt(Number(p.cost))}</td>
                    <td className="px-4 py-3 font-medium text-[#F1F5F9]">{fmt(Number(p.price))}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: m >= 30 ? "#22c55e" : m >= 15 ? "#f59e0b" : "#ef4444" }}
                      >
                        {m}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editStockId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={newStock}
                            onChange={(e) => setNewStock(Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded-lg text-sm text-[#F1F5F9] text-center focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(124,58,237,0.3)" }}
                            autoFocus
                          />
                          <button onClick={() => handleStockSave(p.id)} className="text-[#22c55e] hover:opacity-80">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditStockId(null)} className="text-[#64748B] hover:opacity-80">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditStockId(p.id); setNewStock(p.stock); }}
                          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                        >
                          <span
                            className="font-bold text-sm"
                            style={{ color: lowStock ? "#ef4444" : "#22c55e" }}
                          >
                            {p.stock}
                          </span>
                          <Edit2 size={10} className="text-[#64748B]" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#94A3B8] hover:bg-white/5 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#ef4444] hover:bg-white/5 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.25)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#F1F5F9]">
                {editId ? "Editar producto" : "Nuevo producto"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-[#64748B] hover:text-[#94A3B8]">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Nombre *" value={form.name} onChange={(v) => handleField("name", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU" value={form.sku as string} onChange={(v) => handleField("sku", v)} />
                <Field label="Categoría" value={form.category as string} onChange={(v) => handleField("category", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Costo $" value={form.cost} onChange={(v) => handleField("cost", v)} />
                <NumField label="Precio $" value={form.price} onChange={(v) => handleField("price", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Stock inicial" value={form.stock} onChange={(v) => handleField("stock", v)} isInt />
                <NumField label="Stock mínimo" value={form.min_stock} onChange={(v) => handleField("min_stock", v)} isInt />
              </div>
              {/* Margen preview */}
              {Number(form.price) > 0 && (
                <p className="text-xs text-[#94A3B8]">
                  Margen: <span className="font-bold text-[#22c55e]">{margin(Number(form.cost), Number(form.price))}%</span>
                  {" · "}Ganancia: <span className="font-bold text-[#22c55e]">{fmt(Number(form.price) - Number(form.cost))}</span>
                </p>
              )}
              {error && <p className="text-xs text-[#ef4444]">{error}</p>}
              <button
                onClick={handleSave}
                disabled={isPending}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #e1691e, #c2531a)" }}
              >
                {isPending ? "Guardando…" : editId ? "Actualizar" : "Crear producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-[#64748B] mb-1 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}
      />
    </div>
  );
}

function NumField({
  label, value, onChange, isInt,
}: {
  label: string; value: number; onChange: (v: number) => void; isInt?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-[#64748B] mb-1 block">{label}</label>
      <input
        type="number"
        min={0}
        step={isInt ? 1 : 0.01}
        value={value}
        onChange={(e) => onChange(isInt ? parseInt(e.target.value) : parseFloat(e.target.value))}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-[#F1F5F9] focus:outline-none"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}
      />
    </div>
  );
}
