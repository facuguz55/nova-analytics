"use client";

import { useState, useMemo } from "react";
import { Users, Crown, ShoppingCart, DollarSign, Download, ArrowUpDown, Mail } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import Link from "next/link";
import { formatCurrency, downloadCSV } from "@/lib/utils";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

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

  const nuevos = customers.length - recurrentes.length;
  const segData = [
    { name: "Recurrentes", value: recurrentes.length, color: "#22c55e" },
    { name: "Nuevos",      value: nuevos,             color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  const topSpenders = useMemo(() =>
    [...customers].sort((a, b) => parseFloat(b.total_spent || "0") - parseFloat(a.total_spent || "0"))
      .slice(0, 6)
      .map((c) => ({ name: (c.name || c.email || "?").split(" ")[0].slice(0, 12), gasto: parseFloat(c.total_spent || "0") })),
    [customers]);

  const KPIS = [
    { label: "Total clientes",    value: customers.length,   format: (n: number) => String(Math.round(n)), icon: Users,        color: "#8b5cf6" },
    { label: "VIP (recurrentes)", value: recurrentes.length, format: (n: number) => String(Math.round(n)), icon: Crown,        color: "#c084fc" },
    { label: "Gasto promedio",    value: avgSpent,           format: formatCurrency, icon: ShoppingCart, color: "#22c55e" },
    { label: "Facturación total", value: totalSpent,         format: formatCurrency, icon: DollarSign,   color: "#c026d3" },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map((s, i) => (
          <div key={s.label} className="metric-card anim-up rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: `${0.05 + i * 0.06}s` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 anim-scale"
              style={{ background: `${s.color}1a`, animationDelay: `${0.12 + i * 0.06}s` }}>
              <s.icon size={18} color={s.color} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <AnimatedNumber value={s.value} format={s.format} className="text-lg font-black text-[#F1F5F9] leading-none" />
              <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="anim-up metric-card lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.28s" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9]">Recurrentes vs nuevos</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Base de clientes</p>
          </div>
          <div className="p-3 flex items-center gap-4">
            <div className="relative" style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={segData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={62} paddingAngle={3} stroke="none" animationDuration={1100}>
                    {segData.map((d) => <Cell key={d.name} fill={d.color} style={{ filter: `drop-shadow(0 0 5px ${d.color}66)` }} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "#F1F5F9" }} formatter={(v, n) => [`${v} clientes`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-lg font-black text-[#22c55e] leading-none">{customers.length > 0 ? `${Math.round((recurrentes.length / customers.length) * 100)}%` : "0%"}</p>
                <p className="text-[9px] text-[#64748B] uppercase tracking-widest mt-0.5">vip</p>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {segData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                  <span className="text-xs text-[#94A3B8] flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-bold text-[#F1F5F9]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="anim-up metric-card lg:col-span-3 rounded-2xl overflow-hidden neon-chart" style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)", animationDelay: "0.34s" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <p className="text-sm font-semibold text-[#F1F5F9]">Top compradores</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Por gasto total</p>
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={topSpenders} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "10px", color: "#F1F5F9" }} cursor={{ fill: "rgba(139,92,246,0.05)" }} formatter={(v) => [formatCurrency(Number(v)), "Gastado"]} />
                <Bar dataKey="gasto" fill="url(#spendGrad)" radius={[0, 5, 5, 0]} animationDuration={1100} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top cliente */}
      {topClient && (
        <Link
          href={`/app/clientes/${topClient.id}`}
          className="rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-purple-500/40 block"
          style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <Crown size={20} color="#8b5cf6" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#64748B]">Top cliente por gasto</p>
            <p className="text-sm font-semibold text-[#F1F5F9]">{topClient.name}</p>
            <p className="text-xs text-[#64748B]">{topClient.email} · {topClient.orders_count} órdenes</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-[#8b5cf6]">{formatCurrency(parseFloat(topClient.total_spent))}</p>
            <p className="text-xs text-[#64748B]">gastado total</p>
          </div>
        </Link>
      )}

      {/* Toolbar: search + sort + export */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        {/* Búsqueda */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-0 w-full sm:w-auto"
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
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
          style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)" }}>
          <ArrowUpDown size={11} color="#64748B" className="ml-2" />
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: sort === o.key ? "#8b5cf6" : "transparent",
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
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}
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
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.15)" }}>
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            Sin clientes que coincidan con &ldquo;{search}&rdquo;
          </div>
        ) : (
          sorted.slice(0, 100).map((c, i) => (
            <Link
              key={c.id}
              href={`/app/clientes/${c.id}`}
              className="flex items-center gap-3 p-3 hover:bg-[rgba(139,92,246,0.04)] transition-colors block"
              style={{ borderBottom: i < sorted.length - 1 ? "1px solid rgba(139,92,246,0.07)" : "none" }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#8b5cf6]"
                style={{ background: "rgba(139,92,246,0.12)" }}>
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
                  style={{ background: "rgba(192,132,252,0.15)", color: "#c084fc" }}>
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
