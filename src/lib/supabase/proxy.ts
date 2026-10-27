import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { configSupabase } from "./config";

// Refresca la sesión de Supabase en cada petición y copia las cookies a la respuesta.
// Devuelve el usuario (o null) para que el proxy pueda proteger rutas (T01 agrega las reglas por rol).
export async function refrescarSesion(peticion: NextRequest, respuesta: NextResponse) {
  const config = configSupabase();
  if (!config) return { usuario: null };

  const supabase = createServerClient(config.url, config.clave, {
    cookies: {
      getAll() {
        return peticion.cookies.getAll();
      },
      setAll(lista) {
        lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return { usuario: data.user };
}
