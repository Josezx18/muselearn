import { crearAlmacenSupabase } from "@/lib/ia/planificador/almacen";
import { exigirEstudiante, manejarError, responderError } from "../_util";

// GET /api/ia/analisis?estudiante_id= — análisis del estudiante en sesión (solo los suyos).
export async function GET(request: Request) {
  try {
    const sesion = await exigirEstudiante(request);
    if (sesion instanceof Response) return sesion;
    const pedido = new URL(request.url).searchParams.get("estudiante_id");
    if (pedido && pedido !== sesion.id) return responderError(403, "sin_permiso", "Solo puedes ver tus propios análisis.");
    return Response.json(await crearAlmacenSupabase().cargarAnalisis(sesion.id));
  } catch (e) {
    return manejarError(e);
  }
}
