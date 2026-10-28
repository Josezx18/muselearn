import { z } from "zod";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { Usuario, Entrega, InformeComprension } from "@/types/contratos";
import { calcularMapa } from "@/lib/ia/informes/mapa";
import { ErrorConversacion, errorConversacion } from "@/lib/ia/conversacion/validacion";
export async function GET(request: Request) {
  try {
    const actual = await obtenerUsuarioActual();
    if (!actual) throw new ErrorConversacion(401, "no_autenticado");
    if (actual.usuario.rol !== "docente") throw new ErrorConversacion(403, "solo_docentes");
    const query = new URL(request.url).searchParams;
    const clase = z.string().uuid().parse(query.get("clase_id"));
    const tarea = z.string().uuid().nullable().parse(query.get("tarea_id"));
    const propia = await actual.db.from("clases").select("id").eq("id",clase).eq("docente_id",actual.usuario.id).maybeSingle();
    if (propia.error) throw propia.error;
    if (!propia.data) throw new ErrorConversacion(404,"clase_no_encontrada");
    const tareas = await actual.db.from("tareas").select("id").eq("clase_id",clase);
    const inscritos = await actual.db.from("inscripciones").select("estudiante_id").eq("clase_id",clase);
    if (tareas.error || inscritos.error) throw tareas.error ?? inscritos.error;
    const ids = (tareas.data ?? []).map(t => t.id as string);
    if (tarea && !ids.includes(tarea)) throw new ErrorConversacion(404,"tarea_no_encontrada");
    const usuarios = (inscritos.data ?? []).length ? await actual.db.from("perfiles").select("*").in("id",inscritos.data!.map(e => e.estudiante_id)) : { data: [], error: null };
    if (usuarios.error) throw usuarios.error;
    const estudiantes = z.array(Usuario).parse(usuarios.data);
    const entregas = ids.length ? await actual.db.from("entregas").select("*").in("tarea_id",tarea ? [tarea] : ids) : { data: [], error: null };
    if (entregas.error) throw entregas.error;
    const filas = z.array(Entrega).parse(entregas.data);
    const informes = filas.length ? await actual.db.from("informes").select("entrega_id,informe").in("entrega_id",filas.map(e => e.id)) : { data: [], error: null };
    if (informes.error) throw informes.error;
    const datos = (informes.data ?? []).map(f => ({ estudiante_id: filas.find(e => e.id === f.entrega_id)!.estudiante_id, informe: InformeComprension.parse(f.informe) }));
    return Response.json(calcularMapa(clase,tarea,estudiantes,datos));
  } catch (e) { return errorConversacion(e); }
}
