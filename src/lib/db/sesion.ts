import { redirect } from "@/i18n/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Mascota, Tema, Usuario } from "@/types/contratos";
import { inicioPorRol } from "./validacion";

type Rol = "docente" | "estudiante";

/** Usuario con sesión + su perfil (nombre, rol, idioma, apariencia), o null. Respeta RLS. */
export async function obtenerUsuarioActual() {
  const db = await crearClienteServidor();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  // "*": así funciona antes y después de agregar columnas nuevas al perfil (tema, mascota).
  const { data: perfil } = await db.from("perfiles").select("*").eq("id", data.user.id).maybeSingle();
  const usuario = Usuario.safeParse(perfil);
  if (!usuario.success) return null;
  const apariencia = {
    tema: Tema.catch("muse").parse(perfil?.tema),
    mascota: Mascota.catch("pagi").parse(perfil?.mascota),
  };
  return { db, usuario: usuario.data, apariencia, correo: data.user.email ?? "" };
}

/** Para layouts de Server Components: sin sesión → login; rol equivocado → su propio inicio. */
export async function exigirRol(rol: Rol, locale: string) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return redirect({ href: "/login", locale });
  if (actual.usuario.rol !== rol) return redirect({ href: inicioPorRol(actual.usuario.rol), locale });
  return { ...actual.usuario, ...actual.apariencia };
}
