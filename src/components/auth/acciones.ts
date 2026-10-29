"use server";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { redirect as redirigirFuera } from "next/navigation";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { idiomaValido, origenDesdeCabeceras, rolParaCuentaNueva, urlCallback } from "@/lib/auth/externo";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/servidor";
import { EntradaLogin, EntradaRegistro, inicioPorRol } from "@/lib/db/validacion";
import { Rol } from "@/types/contratos";
import { TERMINOS_VERSION } from "@/lib/terminos";

/** Estado que devuelven los formularios: la clave de error se traduce en el cliente (auth.errores.*). */
export interface EstadoForm {
  error?: "datos" | "correo_usado" | "credenciales" | "servidor" | "limite" | "enlace_vencido" | "terminos";
  enviado?: boolean;
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
  if (datos.get("acepto") !== "si") return { error: "terminos" };
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
  const perfil = { id: data.user.id, rol, nombre, idioma: locale };
  const aceptacion = { terminos_version: TERMINOS_VERSION, terminos_aceptados_en: new Date().toISOString() };
  let { error: errorPerfil } = await admin.from("perfiles").insert({ ...perfil, ...aceptacion });
  if (errorPerfil && (errorPerfil.code === "42703" || errorPerfil.code === "PGRST204")) {
    // Antes de la migración 0008 no existen las columnas de términos: se crea el perfil sin ellas.
    ({ error: errorPerfil } = await admin.from("perfiles").insert(perfil));
  }
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

/**
 * "Continuar con Google": Supabase arma la dirección de Google (con PKCE, el verificador queda en una cookie)
 * y al volver /api/auth/callback crea la sesión. El rol solo se usa si la cuenta es nueva.
 */
export async function entrarConGoogle(datos: FormData): Promise<void> {
  const locale = idiomaValido(await getLocale());
  const rol = datos.get("rol") ? rolParaCuentaNueva(texto(datos, "rol")) : undefined;
  const db = await crearClienteServidor();
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: urlCallback(origenDesdeCabeceras(await headers()), { locale, rol }),
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    console.warn(`[auth] Google no disponible: ${error?.message ?? "sin url"}`);
    return redirect({ href: "/login?error=google", locale });
  }
  return redirigirFuera(data.url);
}

/** Pide el correo para crear una contraseña nueva. Siempre dice "enviado" (no revela si el correo existe). */
export async function solicitarRecuperacion(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const correo = z.string().trim().toLowerCase().email().max(120).safeParse(texto(datos, "correo"));
  if (!correo.success) return { error: "datos" };
  const locale = idiomaValido(await getLocale());
  const db = await crearClienteServidor();
  const { error } = await db.auth.resetPasswordForEmail(correo.data, {
    redirectTo: urlCallback(origenDesdeCabeceras(await headers()), { locale, siguiente: "nueva-contrasena" }),
  });
  if (error) {
    console.warn(`[auth] recuperación: ${error.status ?? ""} ${error.message}`);
    if (error.status === 429) return { error: "limite" };
  }
  return { enviado: true };
}

/** Guarda la contraseña nueva. Requiere la sesión que abre el enlace del correo de recuperación. */
export async function guardarNuevaContrasena(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const nueva = z.string().min(8).max(72).safeParse(texto(datos, "contrasena"));
  if (!nueva.success) return { error: "datos" };
  const db = await crearClienteServidor();
  const { data } = await db.auth.getUser();
  if (!data.user) return { error: "enlace_vencido" };
  const { error } = await db.auth.updateUser({ password: nueva.data });
  if (error) {
    console.warn(`[auth] nueva contraseña: ${error.message}`);
    return { error: /different|same/i.test(error.message) ? "datos" : "servidor" };
  }
  const { data: perfil } = await db.from("perfiles").select("rol").eq("id", data.user.id).maybeSingle();
  const rol = Rol.safeParse(perfil?.rol);
  return redirect({ href: rol.success ? inicioPorRol(rol.data) : "/login", locale: await getLocale() });
}

/** Guarda que el usuario aceptó la versión vigente de los Términos y la Privacidad (lo escribe el servidor). */
export async function aceptarTerminos(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  if (datos.get("acepto") !== "si") return { error: "terminos" };
  const db = await crearClienteServidor();
  const { data } = await db.auth.getUser();
  const locale = await getLocale();
  if (!data.user) return redirect({ href: "/login", locale });
  const admin = crearClienteAdmin();
  const { error } = await admin
    .from("perfiles")
    .update({ terminos_version: TERMINOS_VERSION, terminos_aceptados_en: new Date().toISOString() })
    .eq("id", data.user.id);
  if (error) {
    console.warn(`[auth] aceptar términos: ${error.message}`);
    return { error: "servidor" };
  }
  const { data: perfil } = await db.from("perfiles").select("rol").eq("id", data.user.id).maybeSingle();
  const rol = Rol.safeParse(perfil?.rol);
  return redirect({ href: rol.success ? inicioPorRol(rol.data) : "/login", locale });
}
