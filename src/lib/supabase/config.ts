// Lee la configuración pública de Supabase. Devuelve null si falta (p. ej. modo mocks sin .env.local).
export function configSupabase(): { url: string; clave: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) return null;
  return { url, clave };
}

/**
 * Opciones de las cookies de sesión. La sesión solo la maneja el servidor (no se usa el cliente de navegador),
 * así que van con httpOnly: un script inyectado no puede leerlas. Secure en producción (HTTPS).
 */
export const OPCIONES_COOKIE_SESION = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
