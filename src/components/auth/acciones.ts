"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/servidor";
import { EntradaLogin, EntradaRegistro, inicioPorRol } from "@/lib/db/validacion";
import { Rol } from "@/types/contratos";

/** Estado que devuelven los formularios: la clave de error se traduce en el cliente (auth.errores.*). */
export interface EstadoForm {
  error?: "datos" | "correo_usado" | "credenciales" | "servidor";
}

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "");

export async function registrarse(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const entrada = EntradaRegistro.safeParse({
    nombre: texto(datos, "nombre"),
    correo: texto(datos, "correo"),
    contrasena: texto(datos, "contrasena"),
    rol: texto(datos, "rol"),
  });
  if (!entrada.success) return { error: "datos" };
  const { nombre, correo, contrasena, rol } = entrada.data;

  // El usuario se crea con el cliente admin (correo ya confirmado, rol en app_metadata: el usuario no puede editarlo).
  const admin = crearClienteAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: correo,
    password: contrasena,
    email_confirm: true,
    app_metadata: { rol },
    user_metadata: { nombre },
  });
  if (error || !data.user) return { error: /already|registered|exists/i.test(error?.message ?? "") ? "correo_usado" : "servidor" };

  const locale = await getLocale();
  const { error: errorPerfil } = await admin.from("perfiles").insert({ id: data.user.id, rol, nombre, idioma: locale });
  if (errorPerfil) {
    await admin.auth.admin.deleteUser(data.user.id); // no dejar cuentas sin perfil
    return { error: "servidor" };
  }

  const db = await crearClienteServidor();
  const { error: errorSesion } = await db.auth.signInWithPassword({ email: correo, password: contrasena });
  if (errorSesion) return { error: "servidor" };
  return redirect({ href: inicioPorRol(rol), locale });
}

export async function iniciarSesion(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const entrada = EntradaLogin.safeParse({ correo: texto(datos, "correo"), contrasena: texto(datos, "contrasena") });
  if (!entrada.success) return { error: "datos" };

  const db = await crearClienteServidor();
  const { data, error } = await db.auth.signInWithPassword({ email: entrada.data.correo, password: entrada.data.contrasena });
  if (error || !data.user) return { error: "credenciales" };

  const { data: perfil } = await db.from("perfiles").select("rol").eq("id", data.user.id).maybeSingle();
  const rol = Rol.safeParse(perfil?.rol);
  if (!rol.success) return { error: "servidor" };
  return redirect({ href: inicioPorRol(rol.data), locale: await getLocale() });
}

export async function cerrarSesion() {
  const db = await crearClienteServidor();
  await db.auth.signOut();
  return redirect({ href: "/login", locale: await getLocale() });
}
