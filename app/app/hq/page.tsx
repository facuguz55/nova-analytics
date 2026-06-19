import { redirect } from "next/navigation";

// El panel HQ se movió a /admin/hq (acceso super_admin)
export default function HQRedirect() {
  redirect("/admin/hq");
}
