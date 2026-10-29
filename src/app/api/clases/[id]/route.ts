import { NextResponse } from "next/server";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { NuevaClase } from "@/lib/db/validacion";
import { borrarClase, claseDelDocente, editarClase } from "@/lib/db/gestion";
import { crearClienteAdmin } from "@/lib/supabase/servidor";

async function docenteYClase(id: string) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo el docente puede cambiar la clase.");
  const clase = await claseDelDocente(actual.db, actual.usuario.id, id);
  if (!clase) return errorHttp(404, "no_encontrada", "Clase no encontrada.");
  return { actual, clase };
}

// GET /api/clases/:id — datos de una clase del docente.
export async function GET(_p: Request, { params }: RouteContext<"/api/clases/[id]">) {
  const r = await docenteYClase((await params).id);
  return r instanceof Response ? r : NextResponse.json(r.clase);
}

// PATCH /api/clases/:id — cambia nombre, materia y grado.
export async function PATCH(peticion: Request, { params }: RouteContext<"/api/clases/[id]">) {
  const r = await docenteYClase((await params).id);
  if (r instanceof Response) return r;
  const entrada = NuevaClase.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success) return errorHttp(400, "datos_invalidos", "Revisa el nombre, la materia y el grado.");
  try {
    return NextResponse.json(await editarClase(r.actual.db, r.clase.id, entrada.data));
  } catch {
    return errorHttp(500, "error_interno", "No se pudo guardar la clase.");
  }
}

// DELETE /api/clases/:id — borra la clase con todo lo que contiene. Sin vuelta atrás.
export async function DELETE(_p: Request, { params }: RouteContext<"/api/clases/[id]">) {
  const r = await docenteYClase((await params).id);
  if (r instanceof Response) return r;
  try {
    await borrarClase(r.actual.db, crearClienteAdmin(), r.clase.id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return errorHttp(500, "error_interno", "No se pudo borrar la clase.");
  }
}
