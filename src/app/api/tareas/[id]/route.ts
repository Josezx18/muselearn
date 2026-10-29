import { NextResponse, after } from "next/server";
import { obtenerTarea } from "@/lib/db/tareas";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { borrarTarea, editarTarea, tareaDelDocente } from "@/lib/db/gestion";
import { replanificarClase } from "@/lib/ia/planificador/replanificar";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { EdicionTarea } from "@/types/contratos";

/** Margen para replanificar a los estudiantes después de responder (segundos). */
export const maxDuration = 120;

export async function GET(_peticion: Request, { params }: RouteContext<"/api/tareas/[id]">) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");

  const { id } = await params;

  try {
    const tarea = await obtenerTarea(actual.db, id);
    if (!tarea) return errorHttp(404, "no_encontrada", "Tarea no encontrada.");
    return NextResponse.json(tarea);
  } catch {
    return errorHttp(500, "error_interno", "No se pudo cargar la tarea.");
  }
}

async function docenteYTarea(id: string) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo el docente puede cambiar la tarea.");
  const tarea = await tareaDelDocente(actual.db, actual.usuario.id, id);
  if (!tarea) return errorHttp(404, "no_encontrada", "Tarea no encontrada.");
  return { actual, tarea };
}

// PATCH /api/tareas/:id — edita título, instrucciones, fecha, competencias o nivel de ayuda.
// Si cambia la fecha, la semana de cada estudiante se vuelve a planificar.
export async function PATCH(peticion: Request, { params }: RouteContext<"/api/tareas/[id]">) {
  const r = await docenteYTarea((await params).id);
  if (r instanceof Response) return r;
  const cambio = EdicionTarea.safeParse(await peticion.json().catch(() => null));
  if (!cambio.success) return errorHttp(400, "datos_invalidos", "Revisa los datos de la tarea.");
  try {
    const tarea = await editarTarea(r.actual.db, r.tarea.id, cambio.data);
    if (cambio.data.fecha_entrega && Date.parse(cambio.data.fecha_entrega) !== Date.parse(r.tarea.fecha_entrega)) {
      after(() => replanificarClase(tarea.clase_id));
    }
    return NextResponse.json(tarea);
  } catch {
    return errorHttp(500, "error_interno", "No se pudo guardar la tarea.");
  }
}

// DELETE /api/tareas/:id — borra la tarea con sus entregas, conversaciones e informes. Sin vuelta atrás.
export async function DELETE(_p: Request, { params }: RouteContext<"/api/tareas/[id]">) {
  const r = await docenteYTarea((await params).id);
  if (r instanceof Response) return r;
  try {
    await borrarTarea(r.actual.db, crearClienteAdmin(), r.tarea.id);
    after(() => replanificarClase(r.tarea.clase_id));
    return new NextResponse(null, { status: 204 });
  } catch {
    return errorHttp(500, "error_interno", "No se pudo borrar la tarea.");
  }
}
