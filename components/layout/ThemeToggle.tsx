"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Leer tema actual del HTML
    const html = document.documentElement;
    setIsDark(!html.classList.contains("light"));
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("light");
      html.classList.remove("dark");
      localStorage.setItem("nova-theme", "light");
      setIsDark(false);
    } else {
      html.classList.remove("light");
      html.classList.add("dark");
      localStorage.setItem("nova-theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      className="flex items-center justify-center rounded-lg transition-all duration-150"
      style={{
        width: "34px",
        height: "34px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        color: "var(--text-muted)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--text)";
        e.currentTarget.style.borderColor = "var(--nova-orange)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  );
}
