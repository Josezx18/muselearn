import { NextResponse } from "next/server";
import { z } from "zod";
import { errorHttp } from "@/lib/db/http";
import { detalleEntrega, tareaDelDocente } from "@/lib/db/gestion";
import { borradorComentario } from "@/lib/ia/docente";
import { docenteConCupo, errorIADocente } from "../_comun";

export const maxDuration = 60;

const Entrada = z.object({ entrega_id: z.string().uuid() });

// POST /api/docente/ia/comentario — borrador del comentario para una entrega. No se guarda: el docente
// lo edita en la ventana de la entrega y decide si lo envía.
export async function POST(peticion: Request) {
  const sesion = await docenteConCupo();
  if (sesion instanceof Response) return sesion;
  const { actual, registrar } = sesion;

  const entrada = Entrada.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success)
    return errorHttp(400, "datos_invalidos", "Identificador inválido.");

  try {
    const detalle = await detalleEntrega(actual.db, entrada.data.entrega_id);
    if (!detalle)
      return errorHttp(404, "no_encontrada", "Entrega no encontrada.");
    const tarea = await tareaDelDocente(
      actual.db,
      actual.usuario.id,
      detalle.entrega.tarea_id,
    );
    if (!tarea)
      return errorHttp(
        403,
        "no_tu_tarea",
        "Esta entrega no es de una de tus tareas.",
      );
    if (detalle.entrega.estado === "pendiente")
      return errorHttp(
        409,
        "sin_entregar",
        "El estudiante todavía no ha entregado.",
      );
    await registrar("borrador_comentario");
    const borrador = await borradorComentario(tarea, detalle);
    return NextResponse.json(borrador);
  } catch (e) {
    return errorIADocente(e, "borrador de comentario");
  }
}
