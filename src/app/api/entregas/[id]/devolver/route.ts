import { avisarEstudianteDeEntrega } from "@/lib/db/avisos";
import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { errorHttp } from "@/lib/db/http";
import { entregaPermitida, EntradaDevolucion, devolverEntrega } from "@/lib/db/calificaciones";
import { crearClienteAdmin } from "@/lib/supabase/servidor";

export async function POST(peticion: Request, { params }: RouteContext<"/api/entregas/[id]/devolver">) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return errorHttp(400, "datos_invalidos", "Identificador inválido.");
  try {
    const entrega = await entregaPermitida(actual.db, actual.usuario, id, true);
    if (!entrega) return errorHttp(404, "no_encontrada", "Entrega no encontrada.");
    const entrada = EntradaDevolucion.safeParse(await peticion.json().catch(() => null));
    if (!entrada.success) return errorHttp(400, "datos_invalidos", "Datos inválidos.");
    const resultado = await devolverEntrega(crearClienteAdmin(), actual.usuario.id, id, entrada.data.motivo);
    await avisarEstudianteDeEntrega(id, "entrega_devuelta", "Tu docente te pidió corregir");
    return NextResponse.json(resultado);
  } catch {
    return errorHttp(500, "error_interno", "No se pudo procesar la calificación.");
  }
}
