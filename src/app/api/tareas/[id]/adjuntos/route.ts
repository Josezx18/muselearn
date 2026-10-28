import { NextResponse } from "next/server";
import { agregarAdjuntoTarea, obtenerClaseDeTarea } from "@/lib/db/tareas";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { subirAdjunto, validarArchivo } from "@/lib/db/almacenamiento";

const MENSAJES = {
  archivo_faltante: "No se recibió archivo.",
  archivo_grande: "El archivo supera 10 MB.",
  tipo_invalido: "Solo PDF e imágenes (JPG, PNG, WebP).",
} as const;

export async function POST(peticion: Request, { params }: RouteContext<"/api/tareas/[id]/adjuntos">) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo los docentes suben adjuntos.");

  const { id } = await params;
  const clase = await obtenerClaseDeTarea(actual.db, id);
  if (!clase) return errorHttp(404, "no_encontrada", "Tarea no encontrada.");
  if (clase.docente_id !== actual.usuario.id) return errorHttp(403, "no_tu_clase", "No puedes modificar una tarea ajena.");

  const datos = await peticion.formData().catch(() => null);
  const archivo = datos?.get("archivo");
  const problema = validarArchivo(archivo);
  if (problema) return errorHttp(400, problema, MENSAJES[problema]);

  try {
    const adjunto = await subirAdjunto(actual.db, `tareas/${id}/`, archivo as File);
    await agregarAdjuntoTarea(actual.db, id, adjunto);
    return NextResponse.json(adjunto, { status: 201 });
  } catch (e) {
    console.warn("[tareas] No se pudo subir el adjunto:", e instanceof Error ? e.message : e);
    return errorHttp(500, "error_interno", "No se pudo subir el adjunto.");
  }
}
