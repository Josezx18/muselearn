// Cuando un estudiante llega a una clase (con el código o importado de Classroom) o llegan tareas nuevas
// importadas, se analizan las tareas pendientes que aún no tienen análisis para él, para que entren en su plan.
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { analizarYGuardar, cargarContextoTarea } from "./servicio";

/** Máximo de análisis por estudiante en una pasada (cada uno es una llamada a la IA). */
const MAX_POR_ESTUDIANTE = 12;

export async function analizarPendientes(
  claseId: string,
  estudianteIds: string[],
  ahora = new Date(),
) {
  if (!estudianteIds.length) return;
  const admin = crearClienteAdmin();
  const { data: tareas, error } = await admin
    .from("tareas")
    .select("id")
    .eq("clase_id", claseId)
    .gt("fecha_entrega", ahora.toISOString())
    .order("fecha_entrega", { ascending: true });
  if (error) throw error;
  const ids = (tareas ?? []).map((t) => t.id as string);
  if (!ids.length) return;

  const { data: hechos } = await admin
    .from("analisis_tareas")
    .select("tarea_id, estudiante_id")
    .in("tarea_id", ids)
    .in("estudiante_id", estudianteIds);
  const ya = new Set(
    (hechos ?? []).map((h) => `${h.tarea_id}:${h.estudiante_id}`),
  );

  const contextos = new Map<
    string,
    Awaited<ReturnType<typeof cargarContextoTarea>>
  >();
  for (const estudiante of estudianteIds) {
    const faltan = ids
      .filter((t) => !ya.has(`${t}:${estudiante}`))
      .slice(0, MAX_POR_ESTUDIANTE);
    for (const tareaId of faltan) {
      if (!contextos.has(tareaId))
        contextos.set(tareaId, await cargarContextoTarea(tareaId));
      const ctx = contextos.get(tareaId);
      if (!ctx) continue;
      try {
        await analizarYGuardar(ctx, estudiante);
      } catch (e) {
        console.warn(
          `[analisis] pendiente ${tareaId.slice(0, 8)} para ${estudiante.slice(0, 8)}: ${(e as Error).message}`,
        );
      }
    }
  }
}
