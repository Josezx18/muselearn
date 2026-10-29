// Entrar con Google y recuperar la contraseña: lógica pura (sin red ni base de datos) para poder probarla.
import { Rol } from "@/types/contratos";
import { routing, type Locale } from "@/i18n/routing";

export const RUTA_CALLBACK = "/api/auth/callback";

/** ¿Está activado "Entrar con Google"? Se activa cuando Google ya está configurado en Supabase. */
export const googleActivo = () => process.env.NEXT_PUBLIC_ENTRAR_CON_GOOGLE === "true";

export function idiomaValido(valor: string | null | undefined): Locale {
  return (routing.locales as readonly string[]).includes(valor ?? "") ? (valor as Locale) : routing.defaultLocale;
}

/** Rol de una cuenta nueva creada con Google: el que eligió en "Crear cuenta", o estudiante. */
export function rolParaCuentaNueva(valor: string | null | undefined): Rol {
  const r = Rol.safeParse(valor);
  return r.success ? r.data : "estudiante";
}

/** Nombre para el perfil a partir de los datos de Google; si no hay, la parte del correo antes de @. */
export function nombreDesdeProveedor(usuario: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const m = usuario.user_metadata ?? {};
  for (const clave of ["full_name", "name"]) {
    const v = m[clave];
    if (typeof v === "string" && v.trim().length >= 2) return v.trim().slice(0, 80);
  }
  const local = (usuario.email ?? "").split("@")[0].replace(/[._-]+/g, " ").trim();
  return local.length >= 2 ? local.slice(0, 80) : "Estudiante";
}

/**
 * Dirección a la que Supabase devuelve al usuario después de Google o del correo de recuperación.
 * `origen` es el de la petición (https://muselearn-five.vercel.app); debe estar en las Redirect URLs de Supabase.
 */
export function urlCallback(origen: string, datos: { locale: Locale; rol?: Rol; siguiente?: "nueva-contrasena" }): string {
  const url = new URL(RUTA_CALLBACK, origen);
  url.searchParams.set("locale", datos.locale);
  if (datos.rol) url.searchParams.set("rol", datos.rol);
  if (datos.siguiente) url.searchParams.set("siguiente", datos.siguiente);
  return url.toString();
}

/** Origen de la app a partir de las cabeceras de la petición (Vercel pone x-forwarded-host/proto). */
export function origenDesdeCabeceras(h: { get(nombre: string): string | null }): string {
  const origen = h.get("origin");
  if (origen && /^https?:\/\/[^/]+$/.test(origen)) return origen;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
