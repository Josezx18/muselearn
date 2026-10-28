import { NextResponse } from "next/server";
import { agregarAdjuntoTarea } from "@/lib/db/tareas";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { AdjuntoSubida } from "@/lib/db/validacion-tareas";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(peticion: Request, { params }: Props) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo los docentes suben adjuntos.");

  const { id } = await params;

  try {
    const formData = await peticion.formData();
    const archivo = formData.get("archivo");
    if (!(archivo instanceof File)) return errorHttp(400, "archivo_faltante", "No se recibió archivo.");

    const MAX_TAMANO = 10 * 1024 * 1024;
    if (archivo.size > MAX_TAMANO) return errorHttp(400, "archivo_grande", "El archivo supera 10 MB.");

    const TIPOS_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) return errorHttp(400, "tipo_invalido", "Solo PDF e imágenes.");

    const adjunto: AdjuntoSubida = {
      nombre: archivo.name,
      ruta: `tareas/${id}/${Date.now()}-${archivo.name}`,
      tipo_mime: archivo.type,
    };

    const resultado = await agregarAdjuntoTarea(actual.db, id, adjunto);
    return NextResponse.json(resultado, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "tarea_no_encontrada") return errorHttp(404, "no_encontrada", "Tarea no encontrada.");
    return errorHttp(500, "error_interno", "No se pudo subir el adjunto.");
  }
}