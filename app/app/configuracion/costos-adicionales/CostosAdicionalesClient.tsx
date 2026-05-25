"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X, DollarSign, Percent, Package, AlertTriangle } from "lucide-react";
import { addAdditionalCost, deleteAdditionalCost } from "@/app/app/actions";
import { toast } from "sonner";
export interface AdditionalCost {
  id: string;
  workspace_id: string;
  name: string;
  type: "fixed" | "variable";
  amount: number;
  currency: string;
  created_at: string;
}

interface Props {
  costs: AdditionalCost[];
  workspaceId: string;
}

interface NewCostForm {
  name: string;
  amount: string;
  currency: string;
}

const EMPTY_FORM: NewCostForm = { name: "", amount: "", currency: "ARS" };

export default function CostosAdicionalesClient({ costs: initialCosts, workspaceId }: Props) {
  const [costs, setCosts] = useState<AdditionalCost[]>(initialCosts);
  const [showModal, setShowModal] = useState<"fixed" | "variable" | null>(null);
  const [form, setForm] = useState<NewCostForm>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fixedCosts    = costs.filter((c) => c.type === "fixed");
  const variableCosts = costs.filter((c) => c.type === "variable");

  const totalFixed    = fixedCosts.reduce((a, b) => a + b.amount, 0);
  const totalVariable = variableCosts.reduce((a, b) => a + b.amount, 0);

  function openModal(type: "fixed" | "variable") {
    setForm(EMPTY_FORM);
    setShowModal(type);
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.amount) return;
    const fd = new FormData();
    fd.set("workspace_id", workspaceId);
    fd.set("name",     form.name.trim());
    fd.set("type",     showModal!);
    fd.set("amount",   form.amount);
    fd.set("currency", form.currency);

    startTransition(async () => {
      try {
        const result = await addAdditionalCost(fd);
        setCosts((prev) => [result as AdditionalCost, ...prev]);
        setShowModal(null);
        toast.success("Costo agregado");
      } catch (e) {
        toast.error("Error: " + (e instanceof Error ? e.message : ""));
      }
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteAdditionalCost(id, workspaceId);
      setCosts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Costo eliminado");
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : ""));
    } finally {
      setDeletingId(null);
    }
  }

  function CostCard({ cost }: { cost: AdditionalCost }) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group"
        style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: cost.type === "fixed" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)" }}
        >
          {cost.type === "fixed"
            ? <DollarSign size={15} color="#22c55e" strokeWidth={2} />
            : <Percent    size={15} color="#f59e0b" strokeWidth={2} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#F1F5F9] truncate">{cost.name}</p>
          <p className="text-xs text-[#64748B]">
            {cost.type === "fixed"
              ? `${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(cost.amount)} / mes`
              : `${cost.amount}% sobre la facturación`
            }
          </p>
        </div>
        <button
          onClick={() => handleDelete(cost.id)}
          disabled={deletingId === cost.id}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-500/10"
          title="Eliminar"
        >
          <Trash2 size={14} color="#ef4444" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
            Costos Adicionales
          </h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            Gastos recurrentes que se descuentan del margen de ganancia
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal("fixed")}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Costo Fijo
          </button>
          <button
            onClick={() => openModal("variable")}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Costo Variable
          </button>
        </div>
      </div>

      {/* Summary */}
      {costs.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#111118", border: "1px solid rgba(34,197,94,0.15)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
              <DollarSign size={18} color="#22c55e" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Costos fijos / mes</p>
              <p className="text-lg font-bold text-[#F1F5F9]">
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(totalFixed)}
              </p>
            </div>
          </div>
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#111118", border: "1px solid rgba(245,158,11,0.15)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
              <Percent size={18} color="#f59e0b" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Costos variables</p>
              <p className="text-lg font-bold text-[#F1F5F9]">{totalVariable.toFixed(1)}% facturación</p>
            </div>
          </div>
        </div>
      )}

      {/* Lists */}
      <div className="space-y-5">
        {/* Costos fijos */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(124,58,237,0.1)", background: "rgba(124,58,237,0.04)" }}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={14} color="#22c55e" strokeWidth={2.5} />
              <p className="text-sm font-semibold text-[#F1F5F9]">Costos Fijos</p>
              <span className="text-xs text-[#64748B]">— monto mensual constante</span>
            </div>
            <span className="text-xs font-bold" style={{ color: "#22c55e" }}>{fixedCosts.length}</span>
          </div>

          {fixedCosts.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={28} color="#475569" className="mx-auto mb-2" />
              <p className="text-sm text-[#475569]">Sin costos fijos configurados</p>
              <p className="text-xs text-[#374151] mt-1">Ej: alquiler, sueldos, plataformas SaaS, hosting...</p>
              <button
                onClick={() => openModal("fixed")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <Plus size={12} strokeWidth={2.5} /> Agregar
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {fixedCosts.map((c) => <CostCard key={c.id} cost={c} />)}
            </div>
          )}
        </div>

        {/* Costos variables */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(124,58,237,0.1)", background: "rgba(124,58,237,0.04)" }}
          >
            <div className="flex items-center gap-2">
              <Percent size={14} color="#f59e0b" strokeWidth={2.5} />
              <p className="text-sm font-semibold text-[#F1F5F9]">Costos Variables</p>
              <span className="text-xs text-[#64748B]">— % sobre facturación</span>
            </div>
            <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>{variableCosts.length}</span>
          </div>

          {variableCosts.length === 0 ? (
            <div className="p-8 text-center">
              <Percent size={28} color="#475569" className="mx-auto mb-2" />
              <p className="text-sm text-[#475569]">Sin costos variables configurados</p>
              <p className="text-xs text-[#374151] mt-1">Ej: comisión de agencia, marketplace fees, logística %...</p>
              <button
                onClick={() => openModal("variable")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
              >
                <Plus size={12} strokeWidth={2.5} /> Agregar
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {variableCosts.map((c) => <CostCard key={c.id} cost={c} />)}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(null); }}
        >
          <div
            className="rounded-2xl w-full max-w-md p-6 space-y-5"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: showModal === "fixed" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)" }}
                >
                  {showModal === "fixed"
                    ? <DollarSign size={18} color="#22c55e" strokeWidth={2} />
                    : <Percent    size={18} color="#f59e0b" strokeWidth={2} />
                  }
                </div>
                <h3 className="text-base font-bold text-[#F1F5F9]">
                  {showModal === "fixed" ? "Nuevo Costo Fijo" : "Nuevo Costo Variable"}
                </h3>
              </div>
              <button onClick={() => setShowModal(null)} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Nombre</label>
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder={showModal === "fixed" ? "Ej: Alquiler local, Sueldos..." : "Ej: Comisión agencia, Flete..."}
                    className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">
                  {showModal === "fixed" ? "Monto mensual (ARS)" : "Porcentaje (%)"}
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <span className="text-sm text-[#64748B]">{showModal === "fixed" ? "$" : "%"}</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    step={showModal === "fixed" ? "100" : "0.1"}
                    min="0"
                    placeholder={showModal === "fixed" ? "50000" : "2.5"}
                    className="flex-1 bg-transparent text-xl font-black text-[#F1F5F9] outline-none"
                    style={{ appearance: "none" } as React.CSSProperties}
                  />
                </div>
              </div>

              {showModal === "fixed" && (
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)" }}>
                  <AlertTriangle size={13} color="#f59e0b" strokeWidth={2} className="mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#94A3B8]">
                    El costo fijo mensual se divide por el volumen de órdenes del período para calcular el impacto por venta.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-[#64748B] transition-all hover:text-[#F1F5F9]"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={isPending || !form.name || !form.amount}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: showModal === "fixed" ? "rgba(34,197,94,0.9)" : "rgba(245,158,11,0.9)" }}
              >
                {isPending ? "Guardando..." : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
