import type { Metadata } from "next";
import IAClient from "./IAClient";
import { getTiendaNubeConnection } from "@/lib/tiendanube/connection";

export const metadata: Metadata = { title: "IA Assistant" };

export default async function IAPage() {
  // El contexto de negocio se arma server-side dentro de /api/ia/chat
  // (aislado por usuario). Acá solo informamos si hay tienda conectada.
  const connection = await getTiendaNubeConnection();
  return <IAClient connected={!!connection} storeName={connection?.storeName ?? null} />;
}
