// Orquesta un análisis completo: carga la tarea, analiza, guarda y recalcula el plan (T03, servidor).
import { Tarea, type AnalisisTarea } from "@/types/contratos";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { planificarSemana, type Almacen } from "../planificador";
import { crearAlmacenSupabase } from "../planificador/almacen";
import { analizarTarea } from ".";

export interface ContextoTarea {
  tarea: Tarea;
  materia: string;
  grado: string;
  docente_id: string;
}

/** Carga la tarea con los datos de su clase. Devuelve null si no existe. */
export async function cargarContextoTarea(tarea_id: string): Promise<ContextoTarea | null> {
  const db = crearClienteAdmin();
  const { data, error } = await db
    .from("tareas")
    .select("*, clases(materia, grado, docente_id)")
    .eq("id", tarea_id)
    .maybeSingle();
  if (error) throw new Error(`tarea: ${error.message}`);
  if (!data) return null;
  const clase = (Array.isArray(data.clases) ? data.clases[0] : data.clases) as
    | { materia: string; grado: string; docente_id: string }
    | null;
  if (!clase) return null;
  const { clases: _clases, ...fila } = data;
  void _clases;
  return { tarea: Tarea.parse(fila), materia: clase.materia, grado: clase.grado, docente_id: clase.docente_id };
}

/** ¿El estudiante está inscrito en la clase de la tarea? */
export async function estaInscrito(tarea_id: string, estudiante_id: string): Promise<boolean> {
  const db = crearClienteAdmin();
  const { data: t } = await db.from("tareas").select("clase_id").eq("id", tarea_id).maybeSingle();
  if (!t) return false;
  const { data } = await db
    .from("inscripciones")
    .select("clase_id")
    .eq("clase_id", t.clase_id)
    .eq("estudiante_id", estudiante_id)
    .maybeSingle();
  return Boolean(data);
}

/** Analiza, guarda en `analisis_tareas` y recalcula el plan de la semana actual. */
export async function analizarYGuardar(
  ctx: ContextoTarea,
  estudiante_id: string,
  almacen: Almacen = crearAlmacenSupabase(),
): Promise<AnalisisTarea> {
  const [idioma, historial] = await Promise.all([almacen.cargarIdioma(estudiante_id), almacen.cargarHistorial(estudiante_id)]);
  const analisis = await analizarTarea(ctx.tarea, { id: estudiante_id, grado: ctx.grado, idioma, historial }, { materia: ctx.materia });
  await almacen.guardarAnalisis(analisis);

  // El plan se reorganiza solo cuando llega un análisis nuevo. Si falla, el análisis ya quedó guardado.
  try {
    await planificarSemana(estudiante_id, undefined, { almacen, causa: "tarea_nueva", idioma });
  } catch (e) {
    console.warn(`[ia] no se pudo recalcular el plan tras analizar: ${(e as Error).message}`);
  }
  return analisis;
}
