// Lee la configuración pública de Supabase. Devuelve null si falta (p. ej. modo mocks sin .env.local).
export function configSupabase(): { url: string; clave: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) return null;
  return { url, clave };
}
