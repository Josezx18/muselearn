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

type Rol = "docente" | "estudiante";
const INICIO: Record<Rol, string> = { docente: "/docente", estudiante: "/estudiante/hoy" };

/**
 * Protección de rutas por rol (T01). Recibe la ruta SIN prefijo de idioma.
 * Devuelve la ruta a la que hay que redirigir, o null si puede pasar.
 * El rol viene de app_metadata (lo fija el servidor al registrar; el usuario no puede editarlo).
 */
export function rutaDeRedireccion(ruta: string, usuario: { app_metadata?: Record<string, unknown> } | null): string | null {
  const area: Rol | null = /^\/docente(\/|$)/.test(ruta) ? "docente" : /^\/estudiante(\/|$)/.test(ruta) ? "estudiante" : null;
  if (area) {
    if (!usuario) return "/login";
    const rol = usuario.app_metadata?.rol;
    if ((rol === "docente" || rol === "estudiante") && rol !== area) return INICIO[rol];
    return null;
  }
  // Unirse a una clase exige sesión.
  if (!usuario && /^\/unirse(\/|$)/.test(ruta)) return "/login";
  // Quien ya tiene sesión no necesita la portada, ni login ni registro: va a su inicio.
  if (usuario && (ruta === "/" || ruta === "" || /^\/(login|registro)(\/|$)/.test(ruta))) {
    const rol = usuario.app_metadata?.rol;
    return rol === "docente" || rol === "estudiante" ? INICIO[rol] : null;
  }
  return null;
}
