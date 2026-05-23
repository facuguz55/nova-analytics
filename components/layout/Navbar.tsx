import { Bell, Search } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

interface NavbarProps {
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function Navbar({ pageTitle, pageSubtitle }: NavbarProps) {
  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: "56px",
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Left: Page title */}
      <div className="flex items-center gap-3">
        {pageTitle && (
          <div>
            <h1
              className="leading-none"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p
                style={{
                  fontFamily: "var(--font-barlow)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "1px",
                }}
              >
                {pageSubtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          className="flex items-center justify-center rounded-lg transition-all duration-150"
          style={{
            width: "34px",
            height: "34px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
          aria-label="Buscar"
        >
          <Search size={15} strokeWidth={2} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="flex items-center justify-center rounded-lg transition-all duration-150"
            style={{
              width: "34px",
              height: "34px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
            aria-label="Notificaciones"
          >
            <Bell size={15} strokeWidth={2} />
          </button>
          {/* Badge */}
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white"
            style={{
              width: "14px",
              height: "14px",
              background: "#e1691e",
              fontFamily: "var(--font-barlow)",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            3
          </span>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Avatar */}
        <div
          className="flex items-center gap-2 rounded-lg px-2 py-1 cursor-pointer transition-all duration-150"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
            style={{
              width: "24px",
              height: "24px",
              background: "linear-gradient(135deg, #e1691e, #a855f7)",
              fontFamily: "var(--font-syne)",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            F
          </div>
          <span
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--text)",
            }}
          >
            Facundo
          </span>
        </div>
      </div>
    </header>
  );
}
