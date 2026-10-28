import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerClaseDeTarea, verificarInscripcion } from "@/lib/db/tareas";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { prefijoEntrega, subirAdjunto, validarArchivo } from "@/lib/db/almacenamiento";

const MENSAJES = {
  archivo_faltante: "No se recibió archivo.",
  archivo_grande: "El archivo supera 10 MB.",
  tipo_invalido: "Solo PDF e imágenes (JPG, PNG, WebP).",
} as const;

/** POST multipart { tarea_id, archivo } → Adjunto. El estudiante sube fotos del cuaderno o archivos ANTES de entregar. */
export async function POST(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "estudiante") return errorHttp(403, "solo_estudiante", "Solo los estudiantes suben archivos de entrega.");

  const datos = await peticion.formData().catch(() => null);
  const tareaId = z.string().uuid().safeParse(datos?.get("tarea_id"));
  if (!tareaId.success) return errorHttp(400, "datos_invalidos", "Falta el id de la tarea.");

  const archivo = datos?.get("archivo");
  const problema = validarArchivo(archivo);
  if (problema) return errorHttp(400, problema, MENSAJES[problema]);

  const clase = await obtenerClaseDeTarea(actual.db, tareaId.data);
  if (!clase) return errorHttp(404, "tarea_no_encontrada", "Tarea no encontrada.");
  if (!(await verificarInscripcion(actual.db, actual.usuario.id, clase.id))) {
    return errorHttp(403, "no_inscrito", "No puedes entregar en una clase a la que no perteneces.");
  }

  try {
    const adjunto = await subirAdjunto(actual.db, prefijoEntrega(tareaId.data, actual.usuario.id), archivo as File);
    return NextResponse.json(adjunto, { status: 201 });
  } catch (e) {
    console.warn("[entregas] No se pudo subir el archivo:", e instanceof Error ? e.message : e);
    return errorHttp(500, "error_interno", "No se pudo subir el archivo.");
  }
}
