// Importa un curso de Classroom a MuseLearn: crea (o reutiliza) la clase vinculada e inscribe a los
// estudiantes que ya tienen cuenta de estudiante en MuseLearn con el mismo correo.
// Los que no tienen cuenta se devuelven para que el docente les comparta el código de la clase.
import type { SupabaseClient } from "@supabase/supabase-js";
import { Clase, type Tarea } from "@/types/contratos";
import { crearClase } from "@/lib/db/clases";
import { crearTarea } from "@/lib/db/tareas";
import { NuevaTarea } from "@/lib/db/validacion-tareas";
import { claseDelDocente } from "@/lib/db/gestion";
import { claseDesdeCurso, tareaDesdeClassroom, type AlumnoClassroom, type CursoClassroom, type TareaClassroom } from "./classroom";

export interface ResultadoImportacion {
  clase: Clase;
  nueva: boolean;
  inscritos: string[]; // nombres inscritos ahora
  yaEstaban: number;
  sinCuenta: { nombre: string; correo: string | null }[];
}

/** correo → id de los usuarios con rol estudiante (cliente admin: los correos viven en auth.users). */
export async function estudiantesPorCorreo(admin: SupabaseClient, correos: string[]): Promise<Map<string, string>> {
  const buscados = new Set(correos.map((c) => c.toLowerCase()));
  const mapa = new Map<string, string>();
  if (buscados.size === 0) return mapa;
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) {
      const correo = u.email?.toLowerCase();
      if (correo && buscados.has(correo) && u.app_metadata?.rol === "estudiante") mapa.set(correo, u.id);
    }
    if (data.users.length < 1000 || mapa.size === buscados.size) break;
  }
  return mapa;
}

export async function importarCurso(
  db: SupabaseClient,
  admin: SupabaseClient,
  docenteId: string,
  curso: CursoClassroom,
  alumnos: AlumnoClassroom[],
): Promise<ResultadoImportacion> {
  // ¿Ya está vinculado? Entonces se actualizan los estudiantes de esa clase.
  const { data: vinculo } = await db
    .from("clases_vinculadas")
    .select("clase_id")
    .eq("docente_id", docenteId)
    .eq("proveedor", "classroom")
    .eq("externo_id", curso.id)
    .maybeSingle();
  let clase = vinculo ? await claseDelDocente(db, docenteId, vinculo.clase_id as string) : null;
  const nueva = !clase;
  if (!clase) {
    clase = await crearClase(db, docenteId, claseDesdeCurso(curso));
    const { error } = await db
      .from("clases_vinculadas")
      .upsert({ clase_id: clase.id, docente_id: docenteId, proveedor: "classroom", externo_id: curso.id });
    if (error) throw error;
  } else {
    await db.from("clases_vinculadas").update({ sincronizada_en: new Date().toISOString() }).eq("clase_id", clase.id);
  }

  const conCorreo = alumnos.filter((a): a is AlumnoClassroom & { correo: string } => !!a.correo);
  const cuentas = await estudiantesPorCorreo(
    admin,
    conCorreo.map((a) => a.correo),
  );
  const { data: actuales } = await admin.from("inscripciones").select("estudiante_id").eq("clase_id", clase.id);
  const yaInscritos = new Set((actuales ?? []).map((f) => f.estudiante_id as string));

  const nuevos = conCorreo.filter((a) => cuentas.has(a.correo) && !yaInscritos.has(cuentas.get(a.correo)!));
  if (nuevos.length) {
    // Cliente admin: el docente no puede insertar inscripciones por RLS. Ya se comprobó que la clase es suya.
    const { error } = await admin.from("inscripciones").upsert(
      nuevos.map((a) => ({ clase_id: clase!.id, estudiante_id: cuentas.get(a.correo)! })),
      { onConflict: "clase_id,estudiante_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
  return {
    clase,
    nueva,
    inscritos: nuevos.map((a) => a.nombre),
    yaEstaban: conCorreo.filter((a) => cuentas.has(a.correo) && yaInscritos.has(cuentas.get(a.correo)!)).length,
    sinCuenta: alumnos.filter((a) => !a.correo || !cuentas.has(a.correo)).map(({ nombre, correo }) => ({ nombre, correo })),
  };
}

export interface ResultadoTareas {
  nuevas: Tarea[];
  yaEstaban: number;
  vencidas: number;
  /** No se importaron por el tope diario de tareas nuevas. */
  porLimite: number;
}

/**
 * Importa las tareas publicadas del curso que todavía no vencen, como tareas "se entrega en Classroom"
 * (con su enlace). No duplica: las ya importadas quedan en tareas_vinculadas. Como máximo `maximo` nuevas.
 */
export async function importarTareasCurso(
  db: SupabaseClient,
  docenteId: string,
  claseId: string,
  tareas: TareaClassroom[],
  op: { ahora?: Date; maximo: number; offsetMin?: number },
): Promise<ResultadoTareas> {
  const ahora = op.ahora ?? new Date();
  const { data: vinculos, error } = await db
    .from("tareas_vinculadas")
    .select("externo_id")
    .eq("clase_id", claseId)
    .eq("proveedor", "classroom");
  if (error) throw error;
  const yaImportadas = new Set((vinculos ?? []).map((v) => v.externo_id as string));

  const resultado: ResultadoTareas = { nuevas: [], yaEstaban: 0, vencidas: 0, porLimite: 0 };
  // Primero las que vencen antes: son las que más importan para el plan de la semana.
  const candidatas: { externo: string; datos: NuevaTarea }[] = [];
  for (const t of tareas) {
    if (yaImportadas.has(t.id)) {
      resultado.yaEstaban++;
      continue;
    }
    const datos = tareaDesdeClassroom(t, claseId, ahora, op.offsetMin);
    if (!datos) {
      resultado.vencidas++;
      continue;
    }
    candidatas.push({ externo: t.id, datos: NuevaTarea.parse(datos) });
  }
  candidatas.sort((a, b) => Date.parse(a.datos.fecha_entrega) - Date.parse(b.datos.fecha_entrega));

  for (const c of candidatas) {
    if (resultado.nuevas.length >= op.maximo) {
      resultado.porLimite++;
      continue;
    }
    const tarea = await crearTarea(db, docenteId, c.datos);
    const { error: errorVinculo } = await db
      .from("tareas_vinculadas")
      .insert({ tarea_id: tarea.id, clase_id: claseId, proveedor: "classroom", externo_id: c.externo });
    if (errorVinculo) throw errorVinculo;
    resultado.nuevas.push(tarea);
  }
  return resultado;
}
