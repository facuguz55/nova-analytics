import type { Metadata } from "next";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";
import { getCustomers } from "@/lib/tiendanube/client";
import Link from "next/link";
import { Store, ArrowRight, AlertTriangle } from "lucide-react";
import ClientesClient from "./ClientesClient";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";

  const connection = await getTiendaNubeConnection();
  let customers: Awaited<ReturnType<typeof getCustomers>> = [];
  let error: string | null = null;

  if (connection) {
    const [c1, c2, c3] = await Promise.allSettled([
      getCustomers(connection.opts, 1, 100),
      getCustomers(connection.opts, 2, 100),
      getCustomers(connection.opts, 3, 100),
    ]);
    if (c1.status === "fulfilled") customers = [...customers, ...c1.value];
    if (c2.status === "fulfilled") customers = [...customers, ...c2.value];
    if (c3.status === "fulfilled") customers = [...customers, ...c3.value];
    if (c1.status === "rejected") error = "Error al cargar clientes desde TiendaNube";
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]" style={{ letterSpacing: "-0.02em" }}>
          Clientes
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          {connection
            ? `${customers.length} clientes en tiempo real desde TiendaNube`
            : "Conectá tu TiendaNube para ver tus clientes"}
        </p>
      </div>

      {!connection && (
        <div className="rounded-2xl p-8 text-center"
          style={{ background: "#111118", border: "1px dashed rgba(139,92,246,0.3)" }}>
          <Store size={40} color="#8b5cf6" className="mx-auto mb-3" />
          <p className="text-[#F1F5F9] font-semibold mb-1">Conectá tu TiendaNube</p>
          <Link href="/app/configuracion/integraciones"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-2"
            style={{ background: "#8b5cf6" }}>
            Ir a Integraciones <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {connection && error && (
        <div className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertTriangle size={18} color="#ef4444" />
          <p className="text-sm text-[#fca5a5]">{error}</p>
        </div>
      )}

      {connection && !error && (
        <ClientesClient customers={customers as any} q={q} />
      )}
    </div>
  );
}
