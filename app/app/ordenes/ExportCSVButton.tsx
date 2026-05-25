"use client";

import { Download } from "lucide-react";
import { downloadCSV } from "@/lib/utils";

interface Order {
  id: number;
  number: number;
  status: string;
  payment_status: string;
  total: string;
  currency: string;
  customer: { name: string; email: string } | null;
  products: Array<{ name: string; quantity: number; price: string }>;
  created_at: string;
}

export default function ExportCSVButton({ orders }: { orders: Order[] }) {
  function handleExport() {
    const rows = orders.map((o) => ({
      "N° Orden":      o.number ?? o.id,
      Estado:          o.status,
      "Estado pago":   o.payment_status,
      Cliente:         o.customer?.name ?? "Anónimo",
      Email:           o.customer?.email ?? "",
      Total:           parseFloat(o.total).toFixed(2),
      Moneda:          o.currency,
      Productos:       o.products?.map((p) => `${p.name} x${p.quantity}`).join(" | ") ?? "",
      Fecha:           new Date(o.created_at).toLocaleDateString("es-AR"),
    }));
    downloadCSV(rows, `ordenes-nova-${new Date().toISOString().split("T")[0]}.csv`);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-85"
      style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#8B5CF6" }}
    >
      <Download size={12} strokeWidth={2} />
      Exportar CSV
    </button>
  );
}
