import { PreferenciasEstudio } from "@/types/contratos";
import { preferenciasPorDefecto } from "@/lib/ia/planificador";
import { crearAlmacenSupabase } from "@/lib/ia/planificador/almacen";
import { exigirEstudiante, manejarError, responderError } from "../ia/_util";

// GET /api/preferencias — preferencias del estudiante (o las de por defecto).
export async function GET(request: Request) {
  try {
    const sesion = await exigirEstudiante(request);
    if (sesion instanceof Response) return sesion;
    const guardadas = await crearAlmacenSupabase().cargarPreferencias(sesion.id);
    return Response.json(guardadas ?? preferenciasPorDefecto(sesion.id));
  } catch (e) {
    return manejarError(e);
  }
}

// PUT /api/preferencias — guarda las franjas libres y la duración de bloque.
export async function PUT(request: Request) {
  try {
    const sesion = await exigirEstudiante(request);
    if (sesion instanceof Response) return sesion;
    const prefs = PreferenciasEstudio.parse(await request.json().catch(() => null));
    if (prefs.estudiante_id !== sesion.id) return responderError(403, "sin_permiso", "Solo puedes cambiar tus preferencias.");
    if (prefs.max_minutos_bloque < 15 || prefs.max_minutos_bloque > 180) {
      return responderError(400, "entrada_invalida", "max_minutos_bloque debe estar entre 15 y 180.");
    }
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const h of prefs.horas_disponibles) {
      if (!hhmm.test(h.desde) || !hhmm.test(h.hasta) || h.desde >= h.hasta) {
        return responderError(400, "entrada_invalida", `Franja inválida: ${h.desde}-${h.hasta}`);
      }
    }
    await crearAlmacenSupabase().guardarPreferencias(prefs);
    return Response.json(prefs);
  } catch (e) {
    return manejarError(e);
  }
}
