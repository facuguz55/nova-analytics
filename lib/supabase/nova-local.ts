import { createClient } from "@supabase/supabase-js";

const url = process.env.NOVA_LOCAL_SUPABASE_URL;
const key = process.env.NOVA_LOCAL_SUPABASE_SERVICE_KEY;

export function createNovaLocalClient() {
  if (!url || !key) {
    throw new Error("NOVA_LOCAL_SUPABASE_URL y NOVA_LOCAL_SUPABASE_SERVICE_KEY son requeridas");
  }
  return createClient(url, key);
}
