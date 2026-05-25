"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Suspense } from "react";

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("Ingresá tu email"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });
    // Log en consola para debugging sin exponer al usuario
    if (error) console.error("[reset-password]", error.message);
    setLoading(false);
    setSent(true);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-[#94A3B8] hover:text-[#8B5CF6] transition-colors"
      >
        Olvidaste tu contraseña?
      </button>
    );
  }

  if (sent) {
    return <p className="text-sm text-[#22c55e] text-center">¡Listo! Revisá tu email para el link de recuperación.</p>;
  }

  return (
    <form onSubmit={handleReset} className="w-full flex flex-col gap-2">
      <input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-[#0a0a0f] border border-[rgba(124,58,237,0.25)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] transition-colors"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border border-[rgba(124,58,237,0.4)] hover:border-[#7C3AED] text-[#8B5CF6] py-2.5 rounded-xl text-sm font-semibold transition-all"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {loading ? "Enviando..." : "Enviar link de recuperación"}
      </button>
    </form>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app/dashboard";
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      toast.error("Email o contrasena incorrectos");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.12)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://xfientejntectnwbqmdr.supabase.co/storage/v1/object/public/Logo%20Nova/Gemini_Generated_Image_mq47ltmq47ltmq47-removebg-preview.png"
              alt="Nova Analytics"
              className="w-9 h-9 object-contain"
            />
            <span className="font-bold text-xl tracking-tight text-[#F1F5F9]">Nova Analytics</span>
          </Link>
        </div>

        <div className="bg-[#111118] border border-[rgba(124,58,237,0.2)] rounded-2xl p-8">
          <h1 className="text-2xl font-black text-[#F1F5F9] mb-1">Bienvenido de vuelta</h1>
          <p className="text-[#94A3B8] text-sm mb-8">Ingresa a tu cuenta para ver tus metricas.</p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 disabled:opacity-60 text-gray-900 py-3 rounded-xl font-semibold text-sm transition-all mb-4"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? "Redirigiendo..." : "Continuar con Google"}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[rgba(124,58,237,0.15)]" />
            <span className="text-xs text-[#94A3B8]">o con email</span>
            <div className="flex-1 h-px bg-[rgba(124,58,237,0.15)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#F1F5F9] mb-2">Email</label>
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
              <label className="block text-sm font-medium text-[#F1F5F9] mb-2">Contrasena</label>
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
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Ingresando..." : "Iniciar sesion"}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <ForgotPassword />
            <p className="text-sm text-[#94A3B8]">
              No tenes cuenta?{" "}
              <Link href="/register" className="text-[#8B5CF6] hover:text-white font-medium transition-colors">
                Crear cuenta gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
