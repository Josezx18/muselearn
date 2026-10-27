import { NextResponse } from "next/server";
import { listarEstudiantes } from "@/lib/db/clases";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";

export async function GET(_peticion: Request, contexto: RouteContext<"/api/clases/[id]/estudiantes">) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo el docente ve la lista.");

  const { id } = await contexto.params;
  try {
    const estudiantes = await listarEstudiantes(actual.db, actual.usuario.id, id);
    if (!estudiantes) return errorHttp(404, "no_existe", "Esa clase no existe o no es tuya.");
    return NextResponse.json(estudiantes);
  } catch {
    return errorHttp(500, "error_interno", "No se pudo cargar la lista.");
  }
}
