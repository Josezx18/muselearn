import { leerInforme } from "@/lib/ia/informes/servidor";
import { contextoEntrega } from "@/lib/ia/conversacion/servidor";
import { ErrorConversacion, errorConversacion } from "@/lib/ia/conversacion/validacion";
import { agregarPracticaASemana } from "@/lib/ia/planificador";
import { crearAlmacenSupabase } from "@/lib/ia/planificador/almacen";

// POST /api/informes/:id/semana — "Agregar a mi semana": pone los pasos de la ruta de práctica en el plan.
// Solo el estudiante dueño de la entrega. No usa IA.
export async function POST(_request: Request, { params }: RouteContext<"/api/informes/[id]/semana">) {
  try {
    const { id } = await params;
    const ctx = await contextoEntrega(id);
    const { ruta } = await leerInforme(id);
    if (!ruta) throw new ErrorConversacion(409, "sin_ruta");
    const resultado = await agregarPracticaASemana(
      ctx.usuario.id,
      { entrega_id: id, tarea_id: ctx.entrega.tarea_id, pasos: ruta.pasos },
      { almacen: crearAlmacenSupabase(), idioma: ctx.usuario.idioma },
    );
    return Response.json(resultado);
  } catch (e) {
    return errorConversacion(e);
  }
}
