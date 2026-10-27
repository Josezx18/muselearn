import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { configSupabase } from "./config";

// Cliente de Supabase con la sesión del usuario (Server Components, Route Handlers, Server Actions).
// Respeta RLS: el usuario solo ve lo que sus políticas permiten.
export async function crearClienteServidor() {
  const config = configSupabase();
  if (!config) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  const almacen = await cookies();

  return createServerClient(config.url, config.clave, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: el proxy refresca la sesión, se puede ignorar.
        }
      },
    },
  });
}

// Cliente con service_role: SALTA el RLS. Solo en el servidor, y solo después de comprobar
// que el usuario tiene permiso sobre esos datos (p. ej. tareas de IA en segundo plano).
export function crearClienteAdmin() {
  const config = configSupabase();
  const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !claveServicio) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  return createClient(config.url, claveServicio, { auth: { persistSession: false } });
}
