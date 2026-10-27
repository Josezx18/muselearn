import { redirect } from "@/i18n/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Usuario } from "@/types/contratos";
import { inicioPorRol } from "./validacion";

type Rol = "docente" | "estudiante";

/** Usuario con sesión + su perfil (nombre, rol, idioma), o null. Respeta RLS. */
export async function obtenerUsuarioActual() {
  const db = await crearClienteServidor();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const { data: perfil } = await db.from("perfiles").select("id, rol, nombre, idioma").eq("id", data.user.id).maybeSingle();
  const usuario = Usuario.safeParse(perfil);
  return usuario.success ? { db, usuario: usuario.data } : null;
}

/** Para layouts de Server Components: sin sesión → login; rol equivocado → su propio inicio. */
export async function exigirRol(rol: Rol, locale: string) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return redirect({ href: "/login", locale });
  if (actual.usuario.rol !== rol) return redirect({ href: inicioPorRol(actual.usuario.rol), locale });
  return actual.usuario;
}
