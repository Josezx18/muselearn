import { z } from "zod";
import { lunesDe } from "@/lib/ia/planificador/algoritmo";
import { offsetPorDefecto, planificarSemana } from "@/lib/ia/planificador";
import { crearAlmacenSupabase } from "@/lib/ia/planificador/almacen";
import { exigirEstudiante, manejarError } from "../_util";

const Semana = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato yyyy-MM-dd").refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida");
const Entrada = z.object({ semana_inicio: Semana.optional() });

// GET /api/ia/plan?semana_inicio= — plan guardado de esa semana (si no hay, lo calcula).
export async function GET(request: Request) {
  try {
    const sesion = await exigirEstudiante(request);
    if (sesion instanceof Response) return sesion;
    const semana = Semana.optional().parse(new URL(request.url).searchParams.get("semana_inicio") ?? undefined);
    const almacen = crearAlmacenSupabase();
    const guardado = await almacen.cargarPlan(sesion.id, semana ?? lunesDe(new Date(), offsetPorDefecto()));
    return Response.json(guardado ?? (await planificarSemana(sesion.id, semana, { almacen, causa: "reorganizar" })));
  } catch (e) {
    return manejarError(e);
  }
}

// POST /api/ia/plan — recalcula y guarda el plan ("Reorganizar").
export async function POST(request: Request) {
  try {
    const sesion = await exigirEstudiante(request);
    if (sesion instanceof Response) return sesion;
    const { semana_inicio } = Entrada.parse(await request.json().catch(() => ({})));
    return Response.json(
      await planificarSemana(sesion.id, semana_inicio, { almacen: crearAlmacenSupabase(), causa: "reorganizar" }),
    );
  } catch (e) {
    return manejarError(e);
  }
}
