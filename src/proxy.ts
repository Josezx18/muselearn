import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refrescarSesion } from "./lib/supabase/proxy";

// Next.js 16: este archivo reemplaza a middleware.ts.
// 1) next-intl agrega el idioma a la URL (/ → /es).  2) Supabase refresca la sesión.
// T01 agrega aquí la protección de rutas por rol (docente / estudiante).
const intl = createIntlMiddleware(routing);

export default async function proxy(peticion: NextRequest) {
  const respuesta = intl(peticion);
  await refrescarSesion(peticion, respuesta);
  return respuesta;
}

export const config = {
  // Todo excepto API, archivos internos de Next y archivos con extensión.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
