import { z } from "zod";
import { analizarYGuardar, cargarContextoTarea, estaInscrito } from "@/lib/ia/analizador/servicio";
import { manejarError, obtenerSesion, responderError } from "../_util";

const Entrada = z.object({ tarea_id: z.string().uuid(), estudiante_id: z.string().uuid() });

// POST /api/ia/analizar — analiza una tarea para un estudiante y recalcula su plan.
export async function POST(request: Request) {
  try {
    const sesion = await obtenerSesion(request);
    if (!sesion) return responderError(401, "no_autenticado", "Inicia sesión para continuar.");

    const entrada = Entrada.safeParse(await request.json().catch(() => null));
    if (!entrada.success) return manejarError(entrada.error);
    const { tarea_id, estudiante_id } = entrada.data;

    const ctx = await cargarContextoTarea(tarea_id);
    if (!ctx) return responderError(404, "tarea_no_encontrada", "La tarea no existe.");

    // Permisos: el servidor (T02), el propio estudiante inscrito o el docente dueño de la clase.
    if (sesion.tipo === "usuario") {
      const permitido =
        sesion.id === ctx.docente_id || (sesion.id === estudiante_id && (await estaInscrito(tarea_id, estudiante_id)));
      if (!permitido) return responderError(403, "sin_permiso", "No tienes permiso sobre esta tarea.");
    }

    return Response.json(await analizarYGuardar(ctx, estudiante_id));
  } catch (e) {
    return manejarError(e);
  }
}
