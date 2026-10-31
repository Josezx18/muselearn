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
