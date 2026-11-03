// Carga inicial en servidor: sesión del usuario, RLS y los mismos contratos de la API.
import { z } from "zod";
import { usarMocks } from "@/lib/api-cliente";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { listarClases } from "@/lib/db/clases";
import { lunesDe } from "@/lib/ia/planificador/algoritmo";
import { offsetPorDefecto } from "@/lib/ia/planificador";
import { analisisMock, planParaSemanaMock } from "@/lib/mocks/ia";
import { clasesMock, usuariosMock } from "@/lib/mocks/clases";
import { tareasMock, entregasMock } from "@/lib/mocks/tareas";
import { ESTUDIANTE_ACTUAL } from "@/lib/mocks/base";
import { AnalisisTarea, Clase, Entrega, PlanSemanal, Tarea, Usuario } from "@/types/contratos";

/** Mismo lunes y zona del centro que el planificador. */
export function semanaActual(hoy: Date = new Date()): string {
  return lunesDe(hoy, offsetPorDefecto());
}

async function sesion(rol: "estudiante" | "docente") {
  const actual = await obtenerUsuarioActual();
  if (!actual || actual.usuario.rol !== rol) throw new Error("sesion_no_autorizada");
  return actual;
}

export async function obtenerDatosTarea(id: string) {
  z.uuid().parse(id);
  if (usarMocks()) {
    const tarea = tareasMock.find((t) => t.id === id) ?? null;
    return {
      tarea: tarea ? Tarea.parse(tarea) : null,
      analisis: analisisMock.find((a) => a.tarea_id === id && a.estudiante_id === ESTUDIANTE_ACTUAL),
      materia: clasesMock.find((c) => c.id === tarea?.clase_id)?.materia,
      entrega: entregasMock.find((e) => e.tarea_id === id && e.estudiante_id === ESTUDIANTE_ACTUAL) ?? null,
    };
  }

  const { db, usuario } = await sesion("estudiante");
  const [tareaRes, analisisRes, clases, entregaRes] = await Promise.all([
    db.from("tareas").select("*").eq("id", id).maybeSingle(),
    db.from("analisis_tareas").select("datos").eq("tarea_id", id).eq("estudiante_id", usuario.id).maybeSingle(),
    listarClases(db),
    db.from("entregas").select("*").eq("tarea_id", id).eq("estudiante_id", usuario.id).maybeSingle(),
  ]);
  if (tareaRes.error || analisisRes.error || entregaRes.error) throw tareaRes.error ?? analisisRes.error ?? entregaRes.error;
  const tarea = Tarea.nullable().parse(tareaRes.data);
  return {
    tarea,
    analisis: analisisRes.data ? AnalisisTarea.parse(analisisRes.data.datos) : undefined,
    materia: clases.find((c) => c.id === tarea?.clase_id)?.materia,
    entrega: Entrega.nullable().parse(entregaRes.data),
  };
}

export async function obtenerDatosHoy(semana: string) {
  z.iso.date().parse(semana);
  if (usarMocks()) {
    return {
      usuario: Usuario.parse(usuariosMock.find((u) => u.id === ESTUDIANTE_ACTUAL)),
      plan: PlanSemanal.parse(planParaSemanaMock(semana)),
      tareas: z.array(Tarea).parse(tareasMock),
      analisis: z.array(AnalisisTarea).parse(analisisMock),
      clases: z.array(Clase).parse(clasesMock),
      semana,
      ahora: new Date().toISOString(),
      offsetMin: offsetPorDefecto(),
    };
  }

  const { db, usuario } = await sesion("estudiante");
  const clases = await listarClases(db);
  const [planRes, tareasRes, analisisRes] = await Promise.all([
    db.from("planes").select("datos").eq("estudiante_id", usuario.id).eq("semana_inicio", semana).maybeSingle(),
    clases.length
      ? db.from("tareas").select("*").in("clase_id", clases.map((c) => c.id))
      : Promise.resolve({ data: [], error: null }),
    db.from("analisis_tareas").select("datos").eq("estudiante_id", usuario.id),
  ]);
  if (planRes.error || tareasRes.error || analisisRes.error) throw planRes.error ?? tareasRes.error ?? analisisRes.error;
  return {
    usuario,
    // Si falta el plan, Dashboard pide al endpoint existente que lo calcule tras hidratar.
    plan: planRes.data ? PlanSemanal.parse(planRes.data.datos) : null,
    tareas: z.array(Tarea).parse(tareasRes.data ?? []),
    analisis: (analisisRes.data ?? []).map((a) => AnalisisTarea.parse(a.datos)),
    clases,
    semana,
    ahora: new Date().toISOString(),
    offsetMin: offsetPorDefecto(),
  };
}

export const obtenerDatosSemana = obtenerDatosHoy;

export async function obtenerDatosComprension() {
  if (usarMocks()) {
    return {
      usuario: Usuario.parse(usuariosMock.find((u) => u.rol === "docente")),
      clases: z.array(Clase).parse(clasesMock),
    };
  }
  const { db, usuario } = await sesion("docente");
  return { usuario, clases: await listarClases(db) };
}

/** Perfil acotado a una clase; sesión y consultas conservan RLS. */
export async function obtenerPerfilEstudiante(claseId: string, estudianteId: string) {
  if (!z.uuid().safeParse(claseId).success || !z.uuid().safeParse(estudianteId).success) return null;
  const { InformeComprension, Calificacion, ComentarioDocente } = await import("@/types/contratos");
  if (usarMocks()) {
    const clase = clasesMock.find((c) => c.id === claseId);
    // El listado mock existente inscribe a todos los estudiantes en ambas clases.
    const estudiante = usuariosMock.find((u) => u.id === estudianteId && u.rol === "estudiante");
    if (!clase || !estudiante) return null;
    const { informesClaseMock } = await import("@/lib/mocks/informes");
    const { calificacionesDemoMock, comentariosDemoMock } = await import("@/lib/mocks/devoluciones");
    const tareas = tareasMock.filter((t) => t.clase_id === claseId);
    const entregas = entregasMock.filter((e) => e.estudiante_id === estudianteId && tareas.some((t) => t.id === e.tarea_id));
    const ids = new Set(entregas.map((e) => e.id));
    return { clase: Clase.parse(clase), estudiante: Usuario.parse(estudiante), tareas: Tarea.array().parse(tareas),
      entregas: Entrega.array().parse(entregas), informes: InformeComprension.array().parse(informesClaseMock.filter((i) => ids.has(i.entrega_id))),
      calificaciones: Calificacion.array().parse(calificacionesDemoMock.filter((c) => ids.has(c.entrega_id))),
      comentarios: ComentarioDocente.array().parse(comentariosDemoMock.filter((c) => ids.has(c.entrega_id))) };
  }
  const actual = await obtenerUsuarioActual();
  if (!actual || actual.usuario.rol !== "docente") return null;
  const { db, usuario } = actual;
  const claseRes = await db.from("clases").select("*").eq("id", claseId).eq("docente_id", usuario.id).maybeSingle();
  if (claseRes.error) throw claseRes.error;
  if (!claseRes.data) return null;
  const inscrito = await db.from("inscripciones").select("estudiante_id").eq("clase_id", claseId).eq("estudiante_id", estudianteId).maybeSingle();
  if (inscrito.error) throw inscrito.error;
  if (!inscrito.data) return null;
  const [perfil, tareasRes, entregasRes] = await Promise.all([
    db.from("perfiles").select("*").eq("id", estudianteId).maybeSingle(),
    db.from("tareas").select("*").eq("clase_id", claseId),
    db.from("entregas").select("*, tareas!inner(clase_id)").eq("estudiante_id", estudianteId).eq("tareas.clase_id", claseId),
  ]);
  if (perfil.error || tareasRes.error || entregasRes.error) throw perfil.error ?? tareasRes.error ?? entregasRes.error;
  if (!perfil.data) return null;
  const entregas = Entrega.array().parse(entregasRes.data);
  const ids = entregas.map((e) => e.id);
  const [informes, notas, comentarios] = ids.length ? await Promise.all([
    db.from("informes").select("informe").in("entrega_id", ids),
    db.from("calificaciones").select("*").in("entrega_id", ids),
    db.from("comentarios_entrega").select("*").in("entrega_id", ids),
  ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  if (informes.error || notas.error || comentarios.error) throw informes.error ?? notas.error ?? comentarios.error;
  return { clase: Clase.parse(claseRes.data), estudiante: Usuario.parse(perfil.data), tareas: Tarea.array().parse(tareasRes.data), entregas,
    informes: InformeComprension.array().parse(informes.data?.map((i) => i.informe)),
    calificaciones: Calificacion.array().parse(notas.data), comentarios: ComentarioDocente.array().parse(comentarios.data) };
}
