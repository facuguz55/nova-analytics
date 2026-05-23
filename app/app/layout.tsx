import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar pageTitle="Nova Analytics" pageSubtitle="Mayo 2026" />
        <main className="flex-1 overflow-y-auto bg-[#0a0a0f]">
          {children}
        </main>
      </div>
    </div>
  );
}
