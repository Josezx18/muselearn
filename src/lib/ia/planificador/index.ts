// Planificador semanal (T03): algoritmo determinista + una llamada a Muse solo para redactar los avisos.
import { z } from "zod";
import { PlanSemanal, type BloquePlan, type Idioma } from "@/types/contratos";
import { llamarMuse as llamarReal, type OpcionesLlamada, type ResultadoIA } from "../cliente";
import { PROMPT_PLANIFICADOR } from "../prompts/planificador";
import { construirPlan, lunesDe, type TareaEnRiesgo, type TareaPlan } from "./algoritmo";
import type { Almacen } from "./almacen";
import { preferenciasPorDefecto } from "./preferencias";

export { preferenciasPorDefecto } from "./preferencias";
export type { Almacen } from "./almacen";

export type CausaCambio = "tarea_nueva" | "bloque_omitido" | "reorganizar" | "analisis_actualizado";

type Llamador = <T>(op: OpcionesLlamada<T>) => Promise<ResultadoIA<T>>;

export interface OpcionesPlan {
  causa?: CausaCambio;
  almacen: Almacen;
  llamar?: Llamador;
  ahora?: Date;
  idioma?: Idioma;
  /** Minutos respecto a UTC de la zona del centro (por defecto ZONA_OFFSET_MIN o -240, Rep. Dominicana). */
  offsetMin?: number;
}

const SalidaAvisos = z.object({ avisos: z.array(z.string().min(1)).min(1).max(3) });

export function offsetPorDefecto(): number {
  const n = Number(process.env.ZONA_OFFSET_MIN);
  return Number.isFinite(n) && process.env.ZONA_OFFSET_MIN ? n : -240;
}

interface Diferencias {
  tareas_nuevas: string[];
  tareas_movidas: string[];
  tareas_retiradas: string[];
}

function diferencias(anterior: BloquePlan[], nuevo: BloquePlan[], tareas: TareaPlan[]): Diferencias {
  const titulo = (id: string) => tareas.find((t) => t.tarea_id === id)?.titulo ?? id;
  const horas = (bs: BloquePlan[]) => {
    const m = new Map<string, string[]>();
    for (const b of bs.filter((x) => x.estado === "planificado")) m.set(b.tarea_id, [...(m.get(b.tarea_id) ?? []), b.inicio]);
    for (const l of m.values()) l.sort();
    return m;
  };
  const antes = horas(anterior);
  const despues = horas(nuevo);
  const salida: Diferencias = { tareas_nuevas: [], tareas_movidas: [], tareas_retiradas: [] };
  for (const [id, h] of despues) {
    const previo = antes.get(id);
    if (!previo) salida.tareas_nuevas.push(titulo(id));
    else if (previo.join() !== h.join()) salida.tareas_movidas.push(titulo(id));
  }
  for (const id of antes.keys()) if (!despues.has(id)) salida.tareas_retiradas.push(titulo(id));
  return salida;
}

/** Avisos sin IA, para cuando el modelo no responde: el plan nunca depende de él. */
export function avisosDeRespaldo(d: Diferencias, riesgo: TareaEnRiesgo[], idioma: Idioma): string[] {
  const es = idioma === "es";
  const avisos: string[] = [];
  if (d.tareas_nuevas.length) {
    avisos.push(es ? `Agregué "${d.tareas_nuevas.join('", "')}" a tu semana.` : `I added "${d.tareas_nuevas.join('", "')}" to your week.`);
  }
  if (d.tareas_movidas.length) {
    avisos.push(es ? `Moví los bloques de "${d.tareas_movidas.join('", "')}".` : `I moved the blocks for "${d.tareas_movidas.join('", "')}".`);
  }
  if (riesgo.length) {
    const nombres = riesgo.map((r) => r.titulo).join('", "');
    avisos.push(
      es
        ? `No alcanza el tiempo para terminar "${nombres}" antes de la entrega; considera ampliar tus horas libres.`
        : `There is not enough time to finish "${nombres}" before it is due; consider adding free hours.`,
    );
  }
  if (avisos.length === 0) avisos.push(es ? "Tu plan está al día." : "Your plan is up to date.");
  return avisos.slice(0, 3);
}

export async function planificarSemana(
  estudiante_id: string,
  semana_inicio: string | undefined,
  opciones: OpcionesPlan,
): Promise<PlanSemanal> {
  const { almacen } = opciones;
  const llamar = opciones.llamar ?? llamarReal;
  const ahora = opciones.ahora ?? new Date();
  const offsetMin = opciones.offsetMin ?? offsetPorDefecto();
  const semana = semana_inicio ?? lunesDe(ahora, offsetMin);
  const idioma = opciones.idioma ?? (await almacen.cargarIdioma(estudiante_id));

  const [tareas, preferencias, planAnterior] = await Promise.all([
    almacen.cargarTareasPlanificables(estudiante_id),
    almacen.cargarPreferencias(estudiante_id),
    almacen.cargarPlan(estudiante_id, semana),
  ]);

  const { bloques, en_riesgo } = construirPlan({
    semana_inicio: semana,
    tareas,
    preferencias: preferencias ?? preferenciasPorDefecto(estudiante_id),
    bloquesAnteriores: planAnterior?.bloques ?? [],
    ahora,
    offsetMin,
  });

  const dif = diferencias(planAnterior?.bloques ?? [], bloques, tareas);
  const hayCambios = dif.tareas_nuevas.length + dif.tareas_movidas.length + dif.tareas_retiradas.length + en_riesgo.length > 0;

  let avisos: string[];
  if (!hayCambios && (opciones.causa ?? "reorganizar") === "reorganizar") {
    avisos = avisosDeRespaldo(dif, en_riesgo, idioma);
  } else {
    try {
      const r = await llamar({
        funcion: "planificar",
        sistema: PROMPT_PLANIFICADOR,
        idioma,
        esquema: SalidaAvisos,
        mensajes: [
          {
            role: "user",
            content: [
              `<cambio>${opciones.causa ?? "reorganizar"}</cambio>`,
              `<diferencias>${JSON.stringify(dif)}</diferencias>`,
              `<en_riesgo>${JSON.stringify(en_riesgo)}</en_riesgo>`,
              `<resumen_plan>${JSON.stringify(
                bloques.filter((b) => b.estado === "planificado").map((b) => ({ titulo: b.titulo, inicio: b.inicio })),
              )}</resumen_plan>`,
            ].join("\n"),
          },
        ],
      });
      avisos = r.datos.avisos;
    } catch (e) {
      console.warn(`[ia] avisos del plan sin IA: ${(e as Error).message}`);
      avisos = avisosDeRespaldo(dif, en_riesgo, idioma);
    }
  }

  const plan = PlanSemanal.parse({
    estudiante_id,
    semana_inicio: semana,
    bloques,
    avisos,
    generado_en: ahora.toISOString(),
  });
  await almacen.guardarPlan(plan);
  return plan;
}

/** Cambia el estado de un bloque; si se omite, recalcula el plan de esa semana. */
export async function actualizarEstadoBloque(
  estudiante_id: string,
  bloque_id: string,
  estado: BloquePlan["estado"],
  opciones: OpcionesPlan,
): Promise<BloquePlan | null> {
  const { almacen } = opciones;
  const plan = await almacen.buscarPlanDeBloque(estudiante_id, bloque_id);
  if (!plan) return null;
  const actualizado: PlanSemanal = {
    ...plan,
    bloques: plan.bloques.map((b) => (b.id === bloque_id ? { ...b, estado } : b)),
  };
  await almacen.guardarPlan(actualizado);
  const nuevo = estado === "omitido" ? await planificarSemana(estudiante_id, plan.semana_inicio, { ...opciones, causa: "bloque_omitido" }) : actualizado;
  return nuevo.bloques.find((b) => b.id === bloque_id) ?? actualizado.bloques.find((b) => b.id === bloque_id) ?? null;
}
