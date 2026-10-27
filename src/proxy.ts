import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refrescarSesion, rutaDeRedireccion } from "./lib/supabase/proxy";

// Next.js 16: este archivo reemplaza a middleware.ts.
// 1) next-intl agrega el idioma a la URL (/ → /es).  2) Supabase refresca la sesión.
// 3) T01: protección de rutas por rol (docente / estudiante). Desactivada con NEXT_PUBLIC_USAR_MOCKS=true.
const intl = createIntlMiddleware(routing);

export default async function proxy(peticion: NextRequest) {
  const respuesta = intl(peticion);
  const { usuario } = await refrescarSesion(peticion, respuesta);

  if (process.env.NEXT_PUBLIC_USAR_MOCKS !== "true") {
    const partes = peticion.nextUrl.pathname.split("/");
    const idioma = (routing.locales as readonly string[]).includes(partes[1]) ? partes[1] : routing.defaultLocale;
    const ruta = (routing.locales as readonly string[]).includes(partes[1]) ? `/${partes.slice(2).join("/")}` : peticion.nextUrl.pathname;
    const destino = rutaDeRedireccion(ruta, usuario);
    if (destino) {
      const redireccion = NextResponse.redirect(new URL(`/${idioma}${destino}`, peticion.url));
      respuesta.cookies.getAll().forEach((c) => redireccion.cookies.set(c)); // conserva la sesión refrescada
      return redireccion;
    }
  }
  return respuesta;
}

export const config = {
  // Todo excepto API, archivos internos de Next y archivos con extensión.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
