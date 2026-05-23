import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

// TODO: Dashboard principal — Fase UI
export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-syne)" }}>Dashboard</h1>
    </div>
  );
}
