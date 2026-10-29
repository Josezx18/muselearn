import { redirect } from "@/i18n/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Mascota, Tema, Usuario } from "@/types/contratos";
import { inicioPorRol } from "./validacion";
import { debeAceptarTerminos } from "@/lib/terminos";

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
  // "aplica" es falso antes de la migración 0008 (sin columnas de términos): entonces no se pide aceptar.
  const terminos = {
    version: typeof perfil?.terminos_version === "string" ? (perfil.terminos_version as string) : null,
    aceptados_en: typeof perfil?.terminos_aceptados_en === "string" ? (perfil.terminos_aceptados_en as string) : null,
    aplica: Boolean(perfil && "terminos_version" in perfil),
  };
  const proveedores = (data.user.identities ?? []).map((i) => i.provider);
  return { db, usuario: usuario.data, apariencia, terminos, proveedores, correo: data.user.email ?? "" };
}

/** Para layouts de Server Components: sin sesión → login; rol equivocado → su propio inicio. */
export async function exigirRol(rol: Rol, locale: string) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return redirect({ href: "/login", locale });
  if (actual.usuario.rol !== rol) return redirect({ href: inicioPorRol(actual.usuario.rol), locale });
  if (actual.terminos.aplica && debeAceptarTerminos(actual.terminos.version)) {
    return redirect({ href: "/aceptar-terminos", locale });
  }
  return { ...actual.usuario, ...actual.apariencia };
}
