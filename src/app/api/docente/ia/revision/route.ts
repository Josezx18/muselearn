import { NextResponse } from "next/server";
import { PedidoRevisionEntrega, RevisionEntrega } from "@/types/contratos";
import { detalleEntrega, tareaDelDocente } from "@/lib/db/gestion";
import { errorHttp } from "@/lib/db/http";
import { revisarEntrega } from "@/lib/ia/docente/revision";
import { docenteConCupo, errorIADocente } from "../_comun";

export const maxDuration = 60;
export async function POST(peticion: Request) {
  try {
    const sesion = await docenteConCupo();
    if (sesion instanceof Response) return sesion;
    const { actual, registrar } = sesion;
    const entrada = PedidoRevisionEntrega.safeParse(await peticion.json().catch(() => null));
    if (!entrada.success) return errorHttp(400, "datos_invalidos", "Identificador inválido.");
    const detalle = await detalleEntrega(actual.db, entrada.data.entrega_id);
    if (!detalle) return errorHttp(404, "no_encontrada", "Entrega no encontrada.");
    const tarea = await tareaDelDocente(actual.db, actual.usuario.id, detalle.entrega.tarea_id);
    if (!tarea) return errorHttp(403, "no_tu_tarea", "Esta entrega no es de tus tareas.");
    if (detalle.entrega.estado === "pendiente") return errorHttp(409, "sin_entregar", "Todavía no se ha entregado.");
    const imagenes = detalle.entrega.adjuntos.filter((a) => a.tipo_mime.startsWith("image/"));
    if (imagenes.length > 6) return errorHttp(400, "demasiadas_imagenes", "Máximo seis imágenes.");
    const fotos: { tipo: string; base64: string }[] = [];
    for (const imagen of imagenes) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(imagen.tipo_mime))
        return errorHttp(400, "imagen_no_admitida", "Formato de imagen no admitido.");
      const { data, error } = await actual.db.storage.from("adjuntos").download(imagen.ruta);
      if (error || !data || data.size > 10 * 1024 * 1024)
        return errorHttp(400, "imagen_no_disponible", "No se pudo leer la imagen.");
      fotos.push({ tipo: imagen.tipo_mime, base64: Buffer.from(await data.arrayBuffer()).toString("base64") });
    }
    // Categoría compatible con el registro y CHECK actuales; comparte el cupo docente.
    await registrar("borrador_comentario");
    return NextResponse.json(RevisionEntrega.parse(await revisarEntrega(tarea, detalle, fotos)));
  } catch (e) { return errorIADocente(e, "revisión de entrega"); }
}
