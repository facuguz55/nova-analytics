"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  otp_expired: "El link de recuperación expiró. Solicitá uno nuevo.",
  access_denied: "Acceso denegado. El link es inválido o ya fue usado.",
  invalid_request: "Link inválido. Solicitá uno nuevo desde el login.",
};

export default function AuthErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("error=")) return;

    const params = new URLSearchParams(hash.replace("#", ""));
    const errorCode = params.get("error_code") ?? params.get("error") ?? "access_denied";
    const message = ERROR_MESSAGES[errorCode] ?? "Ocurrió un error de autenticación. Intentá de nuevo.";

    // Limpiar el hash de la URL antes de redirigir
    window.history.replaceState(null, "", window.location.pathname);

    toast.error(message, { duration: 5000 });
    router.push("/login");
  }, [router]);

  return null;
}
