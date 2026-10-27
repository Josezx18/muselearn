import { NextResponse } from "next/server";
import { crearClase, listarClases } from "@/lib/db/clases";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { NuevaClase } from "@/lib/db/validacion";

export async function GET() {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  try {
    return NextResponse.json(await listarClases(actual.db));
  } catch {
    return errorHttp(500, "error_interno", "No se pudieron cargar las clases.");
  }
}

export async function POST(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo los docentes crean clases.");

  const entrada = NuevaClase.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success) return errorHttp(400, "datos_invalidos", "Revisa el nombre, la materia y el grado.");

  try {
    return NextResponse.json(await crearClase(actual.db, actual.usuario.id, entrada.data), { status: 201 });
  } catch {
    return errorHttp(500, "error_interno", "No se pudo crear la clase.");
  }
}
