import { NextResponse } from "next/server";
import { CambioPerfil, PerfilUsuario } from "@/types/contratos";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";

type Actual = NonNullable<Awaited<ReturnType<typeof obtenerUsuarioActual>>>;
const perfilDe = (a: Actual) =>
  PerfilUsuario.parse({
    ...a.usuario,
    ...a.apariencia,
    correo: a.correo,
    terminos_version: a.terminos.version,
    terminos_aceptados_en: a.terminos.aceptados_en,
  });

// GET /api/perfil — el perfil del usuario con sesión (incluye correo y apariencia).
export async function GET() {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  return NextResponse.json(perfilDe(actual));
}

// PATCH /api/perfil — cambia nombre, idioma, tema o mascota. El rol no se puede cambiar (ni la base lo permite).
export async function PATCH(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const cambio = CambioPerfil.safeParse(await peticion.json().catch(() => null));
  if (!cambio.success) return errorHttp(400, "datos_invalidos", "Revisa los datos del perfil.");

  const { error } = await actual.db.from("perfiles").update(cambio.data).eq("id", actual.usuario.id);
  if (error) {
    // Antes de la migración 0005 no existen tema/mascota: se guarda lo demás y la apariencia queda en el navegador.
    const resto = Object.fromEntries(Object.entries(cambio.data).filter(([k]) => k !== "tema" && k !== "mascota"));
    const faltanColumnas = error.code === "42703" || error.code === "PGRST204";
    if (!faltanColumnas) return errorHttp(500, "error_interno", "No se pudo guardar el perfil.");
    if (Object.keys(resto).length) {
      const reintento = await actual.db.from("perfiles").update(resto).eq("id", actual.usuario.id);
      if (reintento.error) return errorHttp(500, "error_interno", "No se pudo guardar el perfil.");
    }
  }
  const nuevo = await obtenerUsuarioActual();
  return NextResponse.json(nuevo ? perfilDe(nuevo) : perfilDe(actual));
}
