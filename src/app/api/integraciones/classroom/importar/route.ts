import { NextResponse } from "next/server";
import { z } from "zod";
import { ErrorClassroom, esDocenteDelCurso, listarAlumnos, obtenerCurso } from "@/lib/integraciones/classroom";
import { importarCurso } from "@/lib/integraciones/importar";
import { errorHttp } from "@/lib/db/http";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { docenteConToken } from "../_comun";

const Entrada = z.object({ curso_id: z.string().min(1).max(64) });

// POST /api/integraciones/classroom/importar { curso_id } — crea o actualiza la clase y sus estudiantes.
export async function POST(peticion: Request) {
  const r = await docenteConToken();
  if (r instanceof Response) return r;
  const entrada = Entrada.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success) return errorHttp(400, "datos_invalidos", "Falta el curso.");
  try {
    if (!(await esDocenteDelCurso(r.token, entrada.data.curso_id)))
      return errorHttp(403, "no_tu_curso", "Solo puedes importar cursos donde eres docente.");
    const [curso, alumnos] = await Promise.all([
      obtenerCurso(r.token, entrada.data.curso_id),
      listarAlumnos(r.token, entrada.data.curso_id),
    ]);
    const resultado = await importarCurso(r.actual.db, crearClienteAdmin(), r.actual.usuario.id, curso, alumnos);
    return NextResponse.json(resultado);
  } catch (e) {
    if (e instanceof ErrorClassroom && e.estado === 401) return errorHttp(401, "sin_conexion", "Vuelve a conectar Google Classroom.");
    console.error(`[classroom] importar: ${(e as Error).message}`);
    return errorHttp(502, "google", "No se pudo importar el curso.");
  }
}
