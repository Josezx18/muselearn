import { NextResponse, after } from "next/server";
import { z } from "zod";
import { ErrorClassroom, esDocenteDelCurso, listarAlumnos, listarTareasCurso, obtenerCurso } from "@/lib/integraciones/classroom";
import { importarCurso, importarTareasCurso, type ResultadoTareas } from "@/lib/integraciones/importar";
import { errorHttp } from "@/lib/db/http";
import { LIMITES, tareasCreadasHoy } from "@/lib/db/limites";
import { analizarPendientes } from "@/lib/ia/analizador/pendientes";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { docenteConToken } from "../_comun";

const Entrada = z.object({ curso_id: z.string().min(1).max(64) });

/** Margen para analizar las tareas de los estudiantes después de responder (segundos). */
export const maxDuration = 300;

// POST /api/integraciones/classroom/importar { curso_id } — crea o actualiza la clase, sus estudiantes y
// las tareas que aún no vencen. Después, en segundo plano, analiza las tareas pendientes de cada estudiante
// para que entren en su plan de la semana.
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
    const admin = crearClienteAdmin();
    const resultado = await importarCurso(r.actual.db, admin, r.actual.usuario.id, curso, alumnos);

    // Tareas: si la conexión es anterior al permiso de tareas, Google responde 403 y se avisa sin fallar.
    let tareas: (ResultadoTareas & { sinPermiso?: boolean }) | null = null;
    try {
      const deGoogle = await listarTareasCurso(r.token, entrada.data.curso_id);
      const libres = Math.max(0, LIMITES.tareas - (await tareasCreadasHoy(r.actual.db, r.actual.usuario.id)));
      tareas = await importarTareasCurso(r.actual.db, r.actual.usuario.id, resultado.clase.id, deGoogle, { maximo: Math.min(10, libres) });
    } catch (e) {
      if (e instanceof ErrorClassroom && (e.estado === 403 || e.estado === 401)) {
        tareas = { nuevas: [], yaEstaban: 0, vencidas: 0, porLimite: 0, sinPermiso: true };
      } else {
        console.error(`[classroom] tareas: ${(e as Error).message}`);
      }
    }

    const claseId = resultado.clase.id;
    after(async () => {
      try {
        const { data } = await admin.from("inscripciones").select("estudiante_id").eq("clase_id", claseId);
        await analizarPendientes(claseId, (data ?? []).map((f) => f.estudiante_id as string));
      } catch (e) {
        console.warn(`[classroom] análisis en segundo plano: ${(e as Error).message}`);
      }
    });

    return NextResponse.json({
      ...resultado,
      tareas: tareas && {
        nuevas: tareas.nuevas.map((t) => t.titulo),
        yaEstaban: tareas.yaEstaban,
        vencidas: tareas.vencidas,
        porLimite: tareas.porLimite,
        sinPermiso: tareas.sinPermiso ?? false,
      },
    });
  } catch (e) {
    if (e instanceof ErrorClassroom && e.estado === 401) return errorHttp(401, "sin_conexion", "Vuelve a conectar Google Classroom.");
    console.error(`[classroom] importar: ${(e as Error).message}`);
    return errorHttp(502, "google", "No se pudo importar el curso.");
  }
}
