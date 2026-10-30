import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { errorHttp } from "@/lib/db/http";
import { entregaPermitida, obtenerCalificacion, guardarCalificacion, EntradaCalificacion } from "@/lib/db/calificaciones";

export async function GET(peticion: Request, { params }: RouteContext<"/api/entregas/[id]/calificacion">) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return errorHttp(400, "datos_invalidos", "Identificador inválido.");
  try {
    const entrega = await entregaPermitida(actual.db, actual.usuario, id, false);
    if (!entrega) return errorHttp(404, "no_encontrada", "Entrega no encontrada.");
    return NextResponse.json(await obtenerCalificacion(actual.db, id));
  } catch {
    return errorHttp(500, "error_interno", "No se pudo procesar la calificación.");
  }
}

export async function PUT(peticion: Request, { params }: RouteContext<"/api/entregas/[id]/calificacion">) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return errorHttp(400, "datos_invalidos", "Identificador inválido.");
  try {
    const entrega = await entregaPermitida(actual.db, actual.usuario, id, true);
    if (!entrega) return errorHttp(404, "no_encontrada", "Entrega no encontrada.");
    const entrada = EntradaCalificacion.safeParse(await peticion.json().catch(() => null));
    if (!entrada.success) return errorHttp(400, "datos_invalidos", "Datos inválidos.");
    return NextResponse.json(await guardarCalificacion(actual.db, actual.usuario.id, id, entrada.data.nota));
  } catch {
    return errorHttp(500, "error_interno", "No se pudo procesar la calificación.");
  }
}
