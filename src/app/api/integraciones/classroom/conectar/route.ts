import { NextResponse } from "next/server";
import { COOKIE_ESTADO, RUTA_COOKIES, configClassroom, uriRedireccion, urlAutorizacion } from "@/lib/integraciones/classroom";
import { obtenerUsuarioActual } from "@/lib/db/sesion";

// GET /api/integraciones/classroom/conectar?locale=es — manda al docente a la pantalla de permisos de Google.
export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "es";
  const volver = new URL(`/${locale}/docente/integraciones/classroom`, url.origin);
  const actual = await obtenerUsuarioActual();
  if (!actual || actual.usuario.rol !== "docente") return NextResponse.redirect(new URL(`/${locale}/login`, url.origin));
  const config = configClassroom();
  if (!config) {
    volver.searchParams.set("error", "sin_configurar");
    return NextResponse.redirect(volver);
  }
  const estado = crypto.randomUUID();
  const respuesta = NextResponse.redirect(urlAutorizacion({ clientId: config.clientId, redirectUri: uriRedireccion(url.origin), estado }));
  respuesta.cookies.set(COOKIE_ESTADO, `${estado}|${locale}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: RUTA_COOKIES,
    maxAge: 600,
  });
  return respuesta;
}
