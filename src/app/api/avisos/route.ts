import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { obtenerAvisos } from "@/lib/db/avisos";
import { errorHttp } from "@/lib/db/http";

export async function GET() {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");

  try {
    const { avisos, noLeidos } = await obtenerAvisos(actual.usuario.id);
    return NextResponse.json({ avisos, noLeidos });
  } catch {
    return errorHttp(500, "error_interno", "No se pudieron cargar los avisos.");
  }
}