"use client";

import { useState } from "react";
import { Users, Crown, ShoppingCart, DollarSign, Download, ArrowUpDown, Mail } from "lucide-react";
import Link from "next/link";
import { formatCurrency, downloadCSV } from "@/lib/utils";

export interface CustomerRow {
  id: number;
  name: string;
  email: string;
  phone?: string;
  total_spent: string;
  orders_count: number;
  created_at: string;
  last_order_id?: number;
  default_address?: { city?: string; province?: string };
}

interface ClientesClientProps {
  customers: CustomerRow[];
  q: string;
}

type SortKey = "spent" | "orders" | "recent";

export default function ClientesClient({ customers, q }: ClientesClientProps) {
  const [sort, setSort] = useState<SortKey>("spent");
  const [search, setSearch] = useState(q);

  const filtered = search.trim()
    ? customers.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "spent")  return parseFloat(b.total_spent) - parseFloat(a.total_spent);
    if (sort === "orders") return b.orders_count - a.orders_count;
    if (sort === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const recurrentes = customers.filter((c) => c.orders_count > 1);
  const totalSpent  = customers.reduce((acc, c) => acc + parseFloat(c.total_spent || "0"), 0);
  const avgSpent    = customers.length > 0 ? totalSpent / customers.length : 0;
  const topClient   = customers.length > 0
    ? [...customers].sort((a, b) => parseFloat(b.total_spent) - parseFloat(a.total_spent))[0]
    : null;

  function handleExportCSV() {
    const rows = sorted.map((c) => ({
      Nombre:         c.name,
      Email:          c.email,
      Teléfono:       c.phone ?? "",
      "Total gastado": parseFloat(c.total_spent || "0").toFixed(2),
      Órdenes:        c.orders_count,
      Ciudad:         c.default_address?.city ?? "",
      Provincia:      c.default_address?.province ?? "",
      "Miembro desde": new Date(c.created_at).toLocaleDateString("es-AR"),
    }));
    downloadCSV(rows, `clientes-nova-${new Date().toISOString().split("T")[0]}.csv`);
  }

  function handleExportEmails() {
    const rows = sorted.map((c) => ({
      Nombre: c.name,
      Email:  c.email,
    }));
    downloadCSV(rows, `emails-clientes-nova-${new Date().toISOString().split("T")[0]}.csv`);
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "spent",  label: "Mayor gasto"    },
    { key: "orders", label: "Más órdenes"    },
    { key: "recent", label: "Más recientes"  },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total clientes",    value: String(customers.length), icon: Users,        color: "#7C3AED" },
          { label: "VIP (recurrentes)", value: String(recurrentes.length), icon: Crown,      color: "#e1691e" },
          { label: "Gasto promedio",    value: formatCurrency(avgSpent),   icon: ShoppingCart, color: "#22c55e" },
          { label: "Facturación total", value: formatCurrency(totalSpent), icon: DollarSign,  color: "#2563EB" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}18` }}>
              <s.icon size={18} color={s.color} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">{s.label}</p>
              <p className="text-lg font-bold text-[#F1F5F9]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top cliente */}
      {topClient && (
        <Link
          href={`/app/clientes/${topClient.id}`}
          className="rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-purple-500/40 block"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <Crown size={20} color="#7C3AED" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#64748B]">Top cliente por gasto</p>
            <p className="text-sm font-semibold text-[#F1F5F9]">{topClient.name}</p>
            <p className="text-xs text-[#64748B]">{topClient.email} · {topClient.orders_count} órdenes</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-[#7C3AED]">{formatCurrency(parseFloat(topClient.total_spent))}</p>
            <p className="text-xs text-[#64748B]">gastado total</p>
          </div>
        </Link>
      )}

      {/* Toolbar: search + sort + export */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[180px]"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <Users size={12} color="#64748B" strokeWidth={2} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="flex-1 bg-transparent text-sm text-[#F1F5F9] outline-none placeholder:text-[#475569]"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.2)" }}>
          <ArrowUpDown size={11} color="#64748B" className="ml-2" />
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: sort === o.key ? "#7C3AED" : "transparent",
                color:      sort === o.key ? "white" : "#94A3B8",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Exportar CSV */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-85"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#8B5CF6" }}
        >
          <Download size={12} strokeWidth={2} />
          CSV
        </button>

        {/* Exportar emails */}
        <button
          onClick={handleExportEmails}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-85"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}
        >
          <Mail size={12} strokeWidth={2} />
          Emails
        </button>

        <span className="text-xs text-[#64748B] ml-auto">
          {sorted.length} cliente{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lista */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(124,58,237,0.15)" }}>
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            Sin clientes que coincidan con &ldquo;{search}&rdquo;
          </div>
        ) : (
          sorted.slice(0, 100).map((c, i) => (
            <Link
              key={c.id}
              href={`/app/clientes/${c.id}`}
              className="flex items-center gap-3 p-3 hover:bg-[rgba(124,58,237,0.04)] transition-colors block"
              style={{ borderBottom: i < sorted.length - 1 ? "1px solid rgba(124,58,237,0.07)" : "none" }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#7C3AED]"
                style={{ background: "rgba(124,58,237,0.12)" }}>
                {c.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F1F5F9] truncate">{c.name}</p>
                <p className="text-xs text-[#64748B] truncate">{c.email}</p>
              </div>
              {c.default_address?.city && (
                <span className="text-xs text-[#475569] hidden sm:block flex-shrink-0">
                  {c.default_address.city}
                </span>
              )}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-[#F1F5F9]">
                  {formatCurrency(parseFloat(c.total_spent || "0"))}
                </p>
                <p className="text-xs text-[#64748B]">{c.orders_count} orden{c.orders_count !== 1 ? "es" : ""}</p>
              </div>
              {c.orders_count > 1 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                  style={{ background: "rgba(225,105,30,0.15)", color: "#e1691e" }}>
                  VIP
                </span>
              )}
            </Link>
          ))
        )}
      </div>
      {sorted.length > 100 && (
        <p className="text-xs text-center text-[#64748B]">
          Mostrando 100 de {sorted.length} — usá el buscador para filtrar
        </p>
      )}
    </div>
  );
}
