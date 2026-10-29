import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ESTADO, COOKIE_TOKEN, RUTA_COOKIES, canjearCodigo, configClassroom, uriRedireccion } from "@/lib/integraciones/classroom";
import { obtenerUsuarioActual } from "@/lib/db/sesion";

// GET /api/integraciones/classroom/callback — Google vuelve aquí con el código; se canjea por un token
// de acceso de corta duración que queda en una cookie httpOnly (no se guarda en la base).
export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const [estadoGuardado, locale = "es"] = ((await cookies()).get(COOKIE_ESTADO)?.value ?? "").split("|");
  const volver = new URL(`/${locale === "en" ? "en" : "es"}/docente/integraciones/classroom`, url.origin);
  const fallar = (codigo: string) => {
    volver.searchParams.set("error", codigo);
    const r = NextResponse.redirect(volver);
    r.cookies.delete({ name: COOKIE_ESTADO, path: RUTA_COOKIES });
    return r;
  };

  const actual = await obtenerUsuarioActual();
  if (!actual || actual.usuario.rol !== "docente") return fallar("sin_sesion");
  if (url.searchParams.get("error")) return fallar("denegado");
  const estado = url.searchParams.get("state");
  const codigo = url.searchParams.get("code");
  if (!estado || !estadoGuardado || estado !== estadoGuardado || !codigo) return fallar("estado_invalido");
  const config = configClassroom();
  if (!config) return fallar("sin_configurar");

  try {
    const token = await canjearCodigo({ codigo, ...config, redirectUri: uriRedireccion(url.origin) });
    const r = NextResponse.redirect(volver);
    r.cookies.delete({ name: COOKIE_ESTADO, path: RUTA_COOKIES });
    r.cookies.set(COOKIE_TOKEN, token.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: RUTA_COOKIES,
      maxAge: Math.max(60, Math.min(token.expires_in - 60, 3000)),
    });
    return r;
  } catch (e) {
    console.error(`[classroom] no se pudo canjear el código: ${(e as Error).message}`);
    return fallar("google");
  }
}
