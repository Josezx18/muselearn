import { z } from "zod";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { calcularMapa } from "@/lib/ia/informes/mapa";
import { ErrorComprension, datosComprension } from "@/lib/db/comprension";
import { ErrorConversacion, errorConversacion } from "@/lib/ia/conversacion/validacion";

export async function GET(request: Request) {
  try {
    const actual = await obtenerUsuarioActual();
    if (!actual) throw new ErrorConversacion(401, "no_autenticado");
    if (actual.usuario.rol !== "docente") throw new ErrorConversacion(403, "solo_docentes");
    const query = new URL(request.url).searchParams;
    const clase = z.string().uuid().parse(query.get("clase_id"));
    const tarea = z.string().uuid().nullable().parse(query.get("tarea_id"));
    const datos = await datosComprension(actual.db, actual.usuario.id, clase, tarea).catch((e) => {
      throw e instanceof ErrorComprension ? new ErrorConversacion(e.estado, e.codigo) : e;
    });
    return Response.json(calcularMapa(clase, tarea, datos.estudiantes, datos.informes));
  } catch (e) {
    return errorConversacion(e);
  }
}
