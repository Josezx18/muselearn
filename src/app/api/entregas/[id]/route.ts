import { NextResponse } from "next/server";
import { z } from "zod";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { detalleEntrega } from "@/lib/db/gestion";

// GET /api/entregas/:id — la entrega completa: texto, archivos, preguntas y respuestas de la verificación
// e informe. La ven el docente de la tarea y el propio estudiante (lo decide el RLS).
export async function GET(_p: Request, { params }: RouteContext<"/api/entregas/[id]">) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return errorHttp(400, "datos_invalidos", "Identificador inválido.");
  try {
    const detalle = await detalleEntrega(actual.db, id);
    return detalle ? NextResponse.json(detalle) : errorHttp(404, "no_encontrada", "Entrega no encontrada.");
  } catch {
    return errorHttp(500, "error_interno", "No se pudo cargar la entrega.");
  }
}
