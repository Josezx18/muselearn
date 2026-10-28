import { NextResponse } from "next/server";
import { crearEntrega, listarEntregas, obtenerEntrega, verificarInscripcion, obtenerClaseDeTarea } from "@/lib/db/tareas";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { EntradaEntrega, QueryEntregas } from "@/lib/db/validacion-tareas";

export async function GET(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");

  const { searchParams } = new URL(peticion.url);
  const query = QueryEntregas.safeParse({ tarea_id: searchParams.get("tarea_id") });
  if (!query.success) return errorHttp(400, "datos_invalidos", "ID de tarea requerido.");

  try {
    if (actual.usuario.rol === "docente") {
      const tareaClase = await obtenerClaseDeTarea(actual.db, query.data.tarea_id);
      if (!tareaClase || tareaClase.docente_id !== actual.usuario.id) {
        return errorHttp(403, "no_tu_clase", "No puedes ver entregas de una clase ajena.");
      }
      const entregas = await listarEntregas(actual.db, query.data.tarea_id);
      return NextResponse.json(entregas);
    } else {
      const entrega = await obtenerEntrega(actual.db, query.data.tarea_id, actual.usuario.id);
      return NextResponse.json(entrega ? [entrega] : []);
    }
  } catch {
    return errorHttp(500, "error_interno", "No se pudieron cargar las entregas.");
  }
}

export async function POST(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "estudiante") return errorHttp(403, "solo_estudiante", "Solo los estudiantes entregan tareas.");

  const entrada = EntradaEntrega.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success) return errorHttp(400, "datos_invalidos", "Datos de entrega inválidos.");

  const { tarea_id } = entrada.data;

  const tareaClase = await obtenerClaseDeTarea(actual.db, tarea_id);
  if (!tareaClase) return errorHttp(404, "tarea_no_encontrada", "Tarea no encontrada.");

  const inscrito = await verificarInscripcion(actual.db, actual.usuario.id, tareaClase.id);
  if (!inscrito) return errorHttp(403, "no_inscrito", "No puedes entregar en una clase a la que no perteneces.");

  try {
    const entrega = await crearEntrega(actual.db, actual.usuario.id, entrada.data);
    return NextResponse.json(entrega, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "tarea_no_encontrada") return errorHttp(404, "tarea_no_encontrada", "Tarea no encontrada.");
    return errorHttp(500, "error_interno", "No se pudo entregar la tarea.");
  }
}