import { NextResponse } from "next/server";
import { ErrorClassroom, listarCursos } from "@/lib/integraciones/classroom";
import { errorHttp } from "@/lib/db/http";
import { docenteConToken } from "../_comun";

// GET /api/integraciones/classroom/cursos — cursos activos del docente en Classroom, marcando los ya importados.
export async function GET() {
  const r = await docenteConToken();
  if (r instanceof Response) return r;
  try {
    const [cursos, { data: vinculos }] = await Promise.all([
      listarCursos(r.token),
      r.actual.db.from("clases_vinculadas").select("clase_id, externo_id").eq("proveedor", "classroom"),
    ]);
    const vinculadas = new Map((vinculos ?? []).map((v) => [v.externo_id as string, v.clase_id as string]));
    return NextResponse.json(
      cursos.map((c) => ({ id: c.id, nombre: c.name, seccion: c.section ?? null, clase_id: vinculadas.get(c.id) ?? null })),
    );
  } catch (e) {
    if (e instanceof ErrorClassroom && e.estado === 401) return errorHttp(401, "sin_conexion", "Vuelve a conectar Google Classroom.");
    console.error(`[classroom] cursos: ${(e as Error).message}`);
    return errorHttp(502, "google", "Google Classroom no respondió.");
  }
}
