import { NextResponse } from "next/server";
import { z } from "zod";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { claseDelDocente, quitarEstudiante } from "@/lib/db/gestion";

// DELETE /api/clases/:id/estudiantes/:estudianteId — el docente quita a un estudiante,
// o el propio estudiante sale de la clase. Sus entregas se conservan.
export async function DELETE(_p: Request, { params }: RouteContext<"/api/clases/[id]/estudiantes/[estudianteId]">) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const { id, estudianteId } = await params;
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(estudianteId).success) {
    return errorHttp(400, "datos_invalidos", "Identificador inválido.");
  }
  const esElMismo = actual.usuario.rol === "estudiante" && actual.usuario.id === estudianteId;
  if (!esElMismo) {
    if (actual.usuario.rol !== "docente" || !(await claseDelDocente(actual.db, actual.usuario.id, id))) {
      return errorHttp(403, "sin_permiso", "No puedes cambiar esta clase.");
    }
  }
  try {
    const quitado = await quitarEstudiante(actual.db, id, estudianteId);
    return quitado ? new NextResponse(null, { status: 204 }) : errorHttp(404, "no_inscrito", "Ese estudiante no está en la clase.");
  } catch {
    return errorHttp(500, "error_interno", "No se pudo quitar al estudiante.");
  }
}
