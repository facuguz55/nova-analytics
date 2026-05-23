/**
 * Layout del dashboard — wrappea todas las rutas /app/xxx
 * Contiene Sidebar + Navbar
 * TODO: Implementar en Fase UI
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Sidebar — placeholder */}
      <aside
        className="w-64 flex-shrink-0 border-r"
        style={{
          background: "var(--bg-sidebar)",
          borderColor: "var(--border)",
        }}
      >
        {/* TODO: Sidebar component */}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar — placeholder */}
        <header
          className="h-14 border-b flex items-center px-6"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          {/* TODO: Navbar component */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
