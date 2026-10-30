import { avisarEstudianteDeEntrega } from "@/lib/db/avisos";
import { NextResponse } from "next/server";
import { z } from "zod";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import {
  borrarComentario,
  comentarioDeEntrega,
  guardarComentario,
  tareaDelDocente,
} from "@/lib/db/gestion";

const Texto = z.object({ texto: z.string().trim().min(1).max(4000) });

async function docenteDeLaEntrega(id: string) {
  const actual = await obtenerUsuarioActual();
  if (!actual)
    return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente")
    return errorHttp(
      403,
      "solo_docente",
      "Solo el docente comenta las entregas.",
    );
  if (!z.string().uuid().safeParse(id).success)
    return errorHttp(400, "datos_invalidos", "Identificador inválido.");
  const { data: entrega } = await actual.db
    .from("entregas")
    .select("tarea_id")
    .eq("id", id)
    .maybeSingle();
  if (
    !entrega ||
    !(await tareaDelDocente(
      actual.db,
      actual.usuario.id,
      entrega.tarea_id as string,
    ))
  ) {
    return errorHttp(404, "no_encontrada", "Entrega no encontrada.");
  }
  return actual;
}

// GET /api/entregas/:id/comentario — el comentario del docente, o null. Lo ven el estudiante dueño y el
// docente de la tarea (lo decide el RLS).
export async function GET(
  _p: Request,
  { params }: RouteContext<"/api/entregas/[id]/comentario">,
) {
  const actual = await obtenerUsuarioActual();
  if (!actual)
    return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return errorHttp(400, "datos_invalidos", "Identificador inválido.");
  return NextResponse.json(await comentarioDeEntrega(actual.db, id));
}

// PUT /api/entregas/:id/comentario — guarda el comentario del docente (lo ve el estudiante).
export async function PUT(
  peticion: Request,
  { params }: RouteContext<"/api/entregas/[id]/comentario">,
) {
  const { id } = await params;
  const actual = await docenteDeLaEntrega(id);
  if (actual instanceof Response) return actual;
  const entrada = Texto.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success)
    return errorHttp(
      400,
      "datos_invalidos",
      "Escribe el comentario (máximo 4000 caracteres).",
    );
  try {
    const comentario = await guardarComentario(actual.db, actual.usuario.id, id, entrada.data.texto);
    await avisarEstudianteDeEntrega(id, "comentario", "Tu docente comentó tu entrega");
    return NextResponse.json(comentario);
  } catch (e) {
    console.error("[entregas/comentario]", e instanceof Error ? e.message : e);
    return errorHttp(500, "error_interno", "No se pudo guardar el comentario.");
  }
}

// DELETE /api/entregas/:id/comentario — quita el comentario.
export async function DELETE(
  _p: Request,
  { params }: RouteContext<"/api/entregas/[id]/comentario">,
) {
  const { id } = await params;
  const actual = await docenteDeLaEntrega(id);
  if (actual instanceof Response) return actual;
  try {
    await borrarComentario(actual.db, id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return errorHttp(500, "error_interno", "No se pudo quitar el comentario.");
  }
}
