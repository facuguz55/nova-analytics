import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import OrdenesClient from "./OrdenesClient";

export const metadata: Metadata = { title: "Órdenes" };

interface SearchParams {
  q?: string;
  status?: string;
  page?: string;
}

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const q = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("tn_orders")
    .select("id, external_id, customer_name, customer_email, total, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,external_id.ilike.%${q}%`);
  }
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  type OrderRow = { id: string; external_id: string; customer_name: string | null; customer_email: string | null; total: number; status: string | null; created_at: string | null };
  type StatRow = { total: number; status: string | null };

  const { data: rawOrders, count } = await query;
  const orders = (rawOrders ?? []) as unknown as OrderRow[];
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  // Stats
  const { data: rawStatsData } = await supabase
    .from("tn_orders")
    .select("total, status");
  const statsData = (rawStatsData ?? []) as unknown as StatRow[];

  const allPaid = statsData.filter((o) => o.status === "paid" || o.status === "closed");
  const totalRevenue = allPaid.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = statsData.length;

  return (
    <OrdenesClient
      orders={orders}
      totalRevenue={totalRevenue}
      totalOrders={totalOrders}
      totalPaid={allPaid.length}
      currentPage={page}
      totalPages={totalPages}
      count={count ?? 0}
      q={q}
      statusFilter={statusFilter}
    />
  );
}
