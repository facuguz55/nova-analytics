"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "El email es obligatorio";
    if (!form.password) e.password = "La contrasena es obligatoria";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    // TODO: integrar Supabase Auth
    toast.error("Auth no configurado todavia.");
    setLoading(false);
    void router;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Nova Analytics
            </span>
          </Link>
        </div>

        <div className="bg-[#111118] border border-[rgba(124,58,237,0.2)] rounded-2xl p-8">
          <h1 className="text-2xl font-black mb-1">
            Bienvenido de vuelta
          </h1>
          <p className="text-[#94A3B8] text-sm mb-8">Ingresa a tu cuenta para ver tus metricas.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#0a0a0f] border border-[rgba(124,58,237,0.25)] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contrasena</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contrasena"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-[rgba(124,58,237,0.25)] rounded-xl px-4 py-3 pr-11 text-sm text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:opacity-90 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Ingresando..." : "Iniciar sesion"}
            </button>
          </form>

          <p className="text-center text-sm text-[#94A3B8] mt-6">
            No tenes cuenta?{" "}
            <Link href="/register" className="text-[#8B5CF6] hover:text-white font-medium transition-colors">
              Crear cuenta gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

