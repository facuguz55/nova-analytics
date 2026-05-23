import type { Metadata } from "next";
export const metadata: Metadata = { title: "Clientes — Nova HQ" };
// Solo accesible para super_admin
export default function HQClientesPage() {
  return <div><h1>Clientes — Nova HQ</h1></div>;
}
