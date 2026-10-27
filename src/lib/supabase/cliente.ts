"use client";

import { createBrowserClient } from "@supabase/ssr";
import { configSupabase } from "./config";

// Cliente de Supabase para componentes de cliente (navegador).
export function crearClienteNavegador() {
  const config = configSupabase();
  if (!config) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  return createBrowserClient(config.url, config.clave);
}
