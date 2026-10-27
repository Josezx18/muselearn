import { z } from "zod";
import { EstadoBloque } from "@/types/contratos";
import { actualizarEstadoBloque } from "@/lib/ia/planificador";
import { crearAlmacenSupabase } from "@/lib/ia/planificador/almacen";
import { exigirEstudiante, manejarError, responderError } from "../../../_util";

const Entrada = z.object({ estado: EstadoBloque });

// PATCH /api/ia/plan/bloques/:id — marca un bloque como hecho u omitido (omitir recalcula el plan).
export async function PATCH(request: Request, ctx: RouteContext<"/api/ia/plan/bloques/[id]">) {
  try {
    const sesion = await exigirEstudiante(request);
    if (sesion instanceof Response) return sesion;
    const { id } = await ctx.params;
    const { estado } = Entrada.parse(await request.json().catch(() => null));
    const bloque = await actualizarEstadoBloque(sesion.id, id, estado, { almacen: crearAlmacenSupabase() });
    if (!bloque) return responderError(404, "bloque_no_encontrado", "Ese bloque no está en tu plan.");
    return Response.json(bloque);
  } catch (e) {
    return manejarError(e);
  }
}
