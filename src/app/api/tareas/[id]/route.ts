import { NextResponse } from "next/server";
import { obtenerTarea } from "@/lib/db/tareas";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_peticion: Request, { params }: Props) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");

  const { id } = await params;

  try {
    const tarea = await obtenerTarea(actual.db, id);
    if (!tarea) return errorHttp(404, "no_encontrada", "Tarea no encontrada.");
    return NextResponse.json(tarea);
  } catch {
    return errorHttp(500, "error_interno", "No se pudo cargar la tarea.");
  }
}