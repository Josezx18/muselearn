// Planificador semanal (T03): algoritmo determinista + una llamada a Muse solo para redactar los avisos.
import { z } from "zod";
import { PlanSemanal, type BloquePlan, type Idioma, type PasoRuta, type PracticaAgregada } from "@/types/contratos";
import { idPractica } from "@/lib/practica";
import { llamarMuse as llamarReal, type OpcionesLlamada, type ResultadoIA } from "../cliente";
import { PROMPT_PLANIFICADOR } from "../prompts/planificador";
import { construirPlan, inicioSemanaMs, lunesDe, ubicarPractica, type PasoAUbicar, type TareaEnRiesgo, type TareaPlan } from "./algoritmo";
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
    avisos.push(
      es ? `Moví los bloques de "${d.tareas_movidas.join('", "')}".` : `I moved the blocks for "${d.tareas_movidas.join('", "')}".`,
    );
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
  const nuevo =
    estado === "omitido"
      ? await planificarSemana(estudiante_id, plan.semana_inicio, { ...opciones, causa: "bloque_omitido" })
      : actualizado;
  return nuevo.bloques.find((b) => b.id === bloque_id) ?? actualizado.bloques.find((b) => b.id === bloque_id) ?? null;
}

export interface RutaParaAgregar {
  entrega_id: string;
  tarea_id: string;
  pasos: Pick<PasoRuta, "titulo" | "minutos">[];
}

/**
 * "Agregar a mi semana": coloca los pasos de la ruta de práctica en las horas libres de esta semana
 * (y lo que no quepa, en la siguiente), sin mover lo ya planificado. Idempotente: si la ruta ya está
 * en el plan, no la duplica. No llama a la IA: el aviso es fijo y no gasta créditos.
 */
export async function agregarPracticaASemana(
  estudiante_id: string,
  ruta: RutaParaAgregar,
  opciones: OpcionesPlan,
): Promise<PracticaAgregada> {
  const { almacen } = opciones;
  const ahora = opciones.ahora ?? new Date();
  const offsetMin = opciones.offsetMin ?? offsetPorDefecto();
  const idioma = opciones.idioma ?? (await almacen.cargarIdioma(estudiante_id));
  const preferencias = (await almacen.cargarPreferencias(estudiante_id)) ?? preferenciasPorDefecto(estudiante_id);
  const ids = ruta.pasos.map((_, i) => idPractica(ruta.entrega_id, i));

  const estaSemana = lunesDe(ahora, offsetMin);
  const siguiente = lunesDe(new Date(inicioSemanaMs(estaSemana, offsetMin) + 7 * 86_400_000 + 12 * 3_600_000), offsetMin);
  const semanas = [estaSemana, siguiente];

  // Si ya se agregó (en cualquiera de las dos semanas), no se duplica.
  const guardados = await Promise.all(semanas.map((s) => almacen.cargarPlan(estudiante_id, s)));
  const existentes = guardados.flatMap((p) => p?.bloques ?? []).filter((b) => ids.includes(b.id));
  if (existentes.length > 0) return { bloques: existentes, sin_ubicar: 0, ya_estaba: true };

  const prefijo = idioma === "es" ? "Práctica" : "Practice";
  let pendientes: PasoAUbicar[] = ruta.pasos.map((p, i) => ({
    id: ids[i],
    tarea_id: ruta.tarea_id,
    titulo: `${prefijo}: ${p.titulo}`,
    minutos: p.minutos,
  }));
  const creados: BloquePlan[] = [];
  for (const [i, semana] of semanas.entries()) {
    if (pendientes.length === 0) break;
    // La semana siguiente solo se toca si hace falta; sin plan guardado se calcula igual que al abrirla.
    const plan =
      guardados[i] ?? (await planificarSemana(estudiante_id, semana, { ...opciones, ahora, offsetMin, idioma, causa: "reorganizar" }));
    const { bloques, sin_ubicar } = ubicarPractica(
      { semana_inicio: plan.semana_inicio, tareas: [], preferencias, bloquesAnteriores: plan.bloques, ahora, offsetMin },
      pendientes,
    );
    pendientes = sin_ubicar;
    if (bloques.length === 0) continue;
    creados.push(...bloques);
    const n = bloques.length;
    const aviso =
      idioma === "es"
        ? `Agregué ${n === 1 ? "1 paso" : `${n} pasos`} de tu ruta de práctica a ${plan.semana_inicio === estaSemana ? "esta semana" : "la próxima semana"}.`
        : `I added ${n === 1 ? "1 step" : `${n} steps`} of your practice route to ${plan.semana_inicio === estaSemana ? "this week" : "next week"}.`;
    await almacen.guardarPlan(
      PlanSemanal.parse({
        ...plan,
        bloques: [...plan.bloques, ...bloques].sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio)),
        avisos: [aviso, ...plan.avisos].slice(0, 3),
        generado_en: ahora.toISOString(),
      }),
    );
  }
  return { bloques: creados, sin_ubicar: pendientes.length, ya_estaba: false };
}
