// Deduplica llamadas a auth dentro del mismo request (layout + page = mismo árbol)
// React cache() garantiza que getUser() solo llama a Supabase UNA vez por render pass
import { cache } from "react";
import { createClient } from "./server";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
