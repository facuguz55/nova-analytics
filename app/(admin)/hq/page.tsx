import type { Metadata } from "next";
export const metadata: Metadata = { title: "Nova HQ" };
// Solo accesible para super_admin
export default function HQPage() {
  return <div><h1>Nova HQ</h1></div>;
}
