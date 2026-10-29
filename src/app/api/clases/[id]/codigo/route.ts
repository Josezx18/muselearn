import { NextResponse } from "next/server";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { cambiarCodigo, claseDelDocente } from "@/lib/db/gestion";

// POST /api/clases/:id/codigo — genera un código de inscripción nuevo; el anterior deja de funcionar.
export async function POST(_p: Request, { params }: RouteContext<"/api/clases/[id]/codigo">) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo el docente puede cambiar el código.");
  const clase = await claseDelDocente(actual.db, actual.usuario.id, (await params).id);
  if (!clase) return errorHttp(404, "no_encontrada", "Clase no encontrada.");
  try {
    return NextResponse.json(await cambiarCodigo(actual.db, clase.id));
  } catch {
    return errorHttp(500, "error_interno", "No se pudo cambiar el código.");
  }
}
