import { NextResponse } from "next/server";
import { COOKIE_TOKEN, RUTA_COOKIES } from "@/lib/integraciones/classroom";

// POST /api/integraciones/classroom/desconectar — olvida el token de Google de este navegador.
export async function POST() {
  const r = new NextResponse(null, { status: 204 });
  r.cookies.delete({ name: COOKIE_TOKEN, path: RUTA_COOKIES });
  return r;
}
